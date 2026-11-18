package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"booking-service/middleware"
	"booking-service/models"
	"booking-service/services"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type BookingController struct {
	bookingService *services.BookingService
}

func NewBookingController(bookingService *services.BookingService) *BookingController {
	return &BookingController{bookingService: bookingService}
}

func (c *BookingController) HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "UP",
		"service": "booking-service",
		"engine":  "Go/Chi + pgx",
		"port":    8005,
	})
}

func (c *BookingController) HoldRoom(w http.ResponseWriter, r *http.Request) {
	var req models.HoldBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Invalid payload: " + err.Error()})
		return
	}

	var userID *uuid.UUID
	if val := r.Context().Value(middleware.UserIDKey); val != nil {
		if uid, ok := val.(uuid.UUID); ok {
			userID = &uid
		}
	}

	resp, err := c.bookingService.HoldRoom(r.Context(), &req, userID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		status := http.StatusBadRequest
		if errors.Is(err, services.ErrNoRoomsLeft) || errors.Is(err, services.ErrLockUnavailable) {
			status = http.StatusConflict
		} else if strings.Contains(err.Error(), "inventory check") {
			status = http.StatusServiceUnavailable
		}
		w.WriteHeader(status)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": resp})
}

func (c *BookingController) ConfirmBooking(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	bookingID, err := uuid.Parse(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Invalid booking UUID"})
		return
	}

	booking, err := c.bookingService.ConfirmBooking(r.Context(), bookingID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Booking confirmed successfully",
		"data":    booking,
	})
}

func (c *BookingController) CancelBooking(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	bookingID, err := uuid.Parse(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Invalid booking UUID"})
		return
	}

	var requesterID *uuid.UUID
	if val := r.Context().Value(middleware.UserIDKey); val != nil {
		if uid, ok := val.(uuid.UUID); ok {
			requesterID = &uid
		}
	}

	if err := c.bookingService.CancelBooking(r.Context(), bookingID, requesterID); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Booking cancelled successfully"})
}

func (c *BookingController) GetBookingByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	bookingID, err := uuid.Parse(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Invalid booking UUID"})
		return
	}

	booking, err := c.bookingService.GetBookingByID(r.Context(), bookingID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Booking not found"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": booking})
}

func (c *BookingController) GetBookingByCode(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	if code == "" {
		code = chi.URLParam(r, "*")
	}
	if code == "" {
		code = r.URL.Query().Get("code")
	}
	booking, err := c.bookingService.GetBookingByCode(r.Context(), code)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Booking not found"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": booking})
}

func (c *BookingController) ListAdminBookings(w http.ResponseWriter, r *http.Request) {
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")
	var page, limit int
	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil {
			page = p
		}
	}
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	result, err := c.bookingService.GetAdminBookings(r.Context(), page, limit)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Could not load reservations"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": result})
}

func (c *BookingController) ListMyBookings(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(uuid.UUID)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Authentication required"})
		return
	}

	bookings, err := c.bookingService.GetUserBookings(r.Context(), userID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Could not load your bookings"})
		return
	}

	result := &models.BookingListResponse{Bookings: bookings, Total: len(bookings)}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": result})
}

func (c *BookingController) GetBookedRoomCount(w http.ResponseWriter, r *http.Request) {
	roomTypeID := chi.URLParam(r, "roomTypeId")
	checkIn := r.URL.Query().Get("checkIn")
	checkOut := r.URL.Query().Get("checkOut")

	count, err := c.bookingService.GetOverlappingCount(r.Context(), roomTypeID, checkIn, checkOut)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "count": count})
}

func (c *BookingController) GetAvailabilityCalendar(w http.ResponseWriter, r *http.Request) {
	roomTypeID := r.URL.Query().Get("roomTypeId")
	if roomTypeID == "" {
		roomTypeID = chi.URLParam(r, "roomTypeId")
	}
	calendar, err := c.bookingService.GetAvailabilityCalendar(r.Context(), roomTypeID, r.URL.Query().Get("startDate"), r.URL.Query().Get("endDate"))
	w.Header().Set("Content-Type", "application/json")
	if err != nil {
		status := http.StatusBadRequest
		if strings.Contains(err.Error(), "inventory check") || strings.Contains(err.Error(), "load availability calendar") {
			status = http.StatusServiceUnavailable
		}
		w.WriteHeader(status)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": err.Error()})
		return
	}
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": calendar})
}

func (c *BookingController) GetQRPass(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	idOrCode := chi.URLParam(r, "id")
	if idOrCode == "" {
		idOrCode = r.URL.Query().Get("id")
	}
	if idOrCode == "" {
		idOrCode = r.URL.Query().Get("code")
	}

	var bookingID uuid.UUID
	var err error

	bookingID, err = uuid.Parse(idOrCode)
	if err != nil {
		// Try to lookup by booking code
		booking, getErr := c.bookingService.GetBookingByCode(r.Context(), idOrCode)
		if getErr != nil {
			w.WriteHeader(http.StatusNotFound)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Booking not found"})
			return
		}
		bookingID = booking.ID
	}

	token, booking, err := c.bookingService.GenerateQRPass(r.Context(), bookingID)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": err.Error()})
		return
	}

	// Generate digital room pass details
	passInfo := map[string]interface{}{
		"token":   token,
		"booking": booking,
		"digitalPass": map[string]interface{}{
			"wifiSsid":        fmt.Sprintf("StayEase_%s", strings.ReplaceAll(booking.HotelName, " ", "")),
			"wifiPassword":    "StayEase@" + booking.CheckInDate.Format("2006"),
			"hotelPhone":      "+91 832 245 6789",
			"emergencyPhone":  "+91 832 245 9999",
			"frontDesk":       "Dial 9 / Lobby Tower A",
			"digitalPassMode": "HMAC-SHA256 Signed FastPass",
			"roomAssigned":    booking.RoomTypeName,
		},
	}

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    passInfo,
	})
}

type verifyQRRequest struct {
	Token string `json:"token"`
}

func (c *BookingController) VerifyQRPass(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req verifyQRRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Token) == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Valid token required in body"})
		return
	}

	booking, alreadyCheckedIn, err := c.bookingService.CheckInByQR(r.Context(), req.Token)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": err.Error()})
		return
	}

	message := "Guest checked in successfully. Digital Room Pass validated."
	if alreadyCheckedIn {
		message = "Guest is already checked in. Pass is active and valid."
	}

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success":          true,
		"message":          message,
		"alreadyCheckedIn": alreadyCheckedIn,
		"data":             booking,
	})
}

