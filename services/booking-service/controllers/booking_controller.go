package controllers

import (
	"encoding/json"
	"net/http"

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
		w.WriteHeader(http.StatusConflict)
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
	result, err := c.bookingService.GetAdminBookings(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Could not load reservations"})
		return
	}
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
