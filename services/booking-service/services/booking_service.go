package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"math"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"
	"unicode"

	"github.com/google/uuid"

	"booking-service/models"
	"booking-service/repository"
	"booking-service/utils"
)

// bookingCodeChars is the alphabet for booking code generation (no ambiguous chars).
const bookingCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

// Sentinel errors exposed to the controller layer.
var (
	ErrLockUnavailable = errors.New("room is being booked by another request, please retry")
	ErrNoRoomsLeft     = errors.New("no rooms available for the requested dates and count")
	ErrBookingNotFound = errors.New("booking not found")
	ErrNotAuthorized   = errors.New("not authorised to perform this action")
)

type AvailabilityCalendarDay struct {
	Date               string `json:"date"`
	BookedInventory    int    `json:"bookedInventory"`
	AvailableInventory int    `json:"availableInventory"`
	IsAvailable        bool   `json:"isAvailable"`
	Status             string `json:"status"`
}

type AvailabilityCalendar struct {
	RoomTypeID     string                    `json:"roomTypeId"`
	StartDate      string                    `json:"startDate"`
	EndDate        string                    `json:"endDate"`
	TotalInventory int                       `json:"totalInventory"`
	Days           []AvailabilityCalendarDay `json:"days"`
}

// inventoryResponse is the payload returned by the Room Service inventory endpoint.
type inventoryResponse struct {
	Inventory     int     `json:"inventory"`
	Capacity      int     `json:"capacity"`
	PricePerNight float64 `json:"pricePerNight"`
}

// BookingService contains all booking domain logic.
type BookingService struct {
	repo            *repository.BookingRepository
	lock            *LockService
	publisher       *RabbitMQPublisher
	hotelServiceURL string
	logger          *slog.Logger
}

// NewBookingService wires up the service with its dependencies.
func NewBookingService(
	repo *repository.BookingRepository,
	lock *LockService,
	publisher *RabbitMQPublisher,
	hotelServiceURL string,
	logger *slog.Logger,
) *BookingService {
	return &BookingService{
		repo:            repo,
		lock:            lock,
		publisher:       publisher,
		hotelServiceURL: hotelServiceURL,
		logger:          logger,
	}
}

// HoldRoom serializes inventory decisions for a room type in PostgreSQL,
// checks each occupied night, then inserts a ten-minute pending-payment hold.
func (s *BookingService) HoldRoom(ctx context.Context, req *models.HoldBookingRequest, userID *uuid.UUID) (*models.HoldBookingResponse, error) {
	// Normalize inbound payload fields
	if req.RoomTypeID == "" {
		if req.RoomID != "" {
			req.RoomTypeID = req.RoomID
		} else if req.RoomTypeIDAlt != "" {
			req.RoomTypeID = req.RoomTypeIDAlt
		}
	}
	if req.HotelID == "" && req.HotelIDAlt != "" {
		req.HotelID = req.HotelIDAlt
	}
	if req.HotelName == "" && req.HotelNameAlt != "" {
		req.HotelName = req.HotelNameAlt
	}
	if req.RoomTypeName == "" && req.RoomTypeNameAlt != "" {
		req.RoomTypeName = req.RoomTypeNameAlt
	}
	if req.CheckInDate == "" {
		if req.CheckIn != "" {
			req.CheckInDate = strings.Split(req.CheckIn, "T")[0]
		} else if req.CheckInDateAlt != "" {
			req.CheckInDate = strings.Split(req.CheckInDateAlt, "T")[0]
		}
	}
	if req.CheckOutDate == "" {
		if req.CheckOut != "" {
			req.CheckOutDate = strings.Split(req.CheckOut, "T")[0]
		} else if req.CheckOutDateAlt != "" {
			req.CheckOutDate = strings.Split(req.CheckOutDateAlt, "T")[0]
		}
	}
	if req.RoomCount < 1 {
		if req.RoomCountAlt >= 1 {
			req.RoomCount = req.RoomCountAlt
		} else {
			req.RoomCount = 1
		}
	}
	if req.GuestsCount < 1 && req.GuestsCountAlt > 0 {
		req.GuestsCount = req.GuestsCountAlt
	}
	if strings.TrimSpace(req.RoomTypeID) == "" || strings.TrimSpace(req.HotelID) == "" {
		return nil, fmt.Errorf("hotel_id and room_type_id are required")
	}
	if req.RoomCount > 20 || req.GuestsCount > 100 {
		return nil, fmt.Errorf("room_count or guests_count exceeds the supported limit")
	}
	if req.GuestFirstName == "" {
		if req.GuestFirstNameAlt != "" {
			req.GuestFirstName = req.GuestFirstNameAlt
		} else if req.GuestName != "" {
			parts := strings.SplitN(strings.TrimSpace(req.GuestName), " ", 2)
			req.GuestFirstName = parts[0]
			if len(parts) > 1 && req.GuestLastName == "" {
				req.GuestLastName = parts[1]
			}
		}
	}
	if req.GuestLastName == "" && req.GuestLastNameAlt != "" {
		req.GuestLastName = req.GuestLastNameAlt
	}
	if req.GuestEmail == "" && req.GuestEmailAlt != "" {
		req.GuestEmail = req.GuestEmailAlt
	}
	if req.GuestPhone == "" && req.GuestPhoneAlt != "" {
		req.GuestPhone = req.GuestPhoneAlt
	}
	if req.SpecialRequests == "" && req.SpecialRequestsAlt != "" {
		req.SpecialRequests = req.SpecialRequestsAlt
	}

	checkIn, err := time.Parse("2006-01-02", req.CheckInDate)
	if err != nil {
		return nil, fmt.Errorf("invalid check_in_date format, expected YYYY-MM-DD")
	}
	checkOut, err := time.Parse("2006-01-02", req.CheckOutDate)
	if err != nil {
		return nil, fmt.Errorf("invalid check_out_date format, expected YYYY-MM-DD")
	}
	if !checkOut.After(checkIn) {
		return nil, fmt.Errorf("check_out_date must be after check_in_date")
	}
	if checkOut.Sub(checkIn) > 365*24*time.Hour {
		return nil, fmt.Errorf("a booking cannot exceed 365 nights")
	}
	if req.RoomCount < 1 {
		return nil, fmt.Errorf("room_count must be at least 1")
	}

	// The PostgreSQL advisory lock covers the entire room type, so requests for
	// partially overlapping date ranges cannot both pass the inventory check.
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if err := s.repo.LockRoomType(ctx, tx, req.RoomTypeID); err != nil {
		return nil, fmt.Errorf("lock room inventory: %w", err)
	}
	if err := s.repo.ExpireStaleBookingsForRoomType(ctx, tx, req.RoomTypeID); err != nil {
		return nil, fmt.Errorf("expire stale room holds: %w", err)
	}

	// 2a — overlapping bookings.
	overlapping, err := s.repo.GetOverlappingCount(ctx, tx, req.RoomTypeID, checkIn, checkOut)
	if err != nil {
		return nil, fmt.Errorf("overlap check: %w", err)
	}

	// 2b — inventory from Hotel Service.
	inventory, pricePerNight, capacity, err := s.fetchInventory(ctx, req.RoomTypeID)
	if err != nil {
		return nil, fmt.Errorf("inventory check: %w", err)
	}

	// 2c — availability gate.
	available := inventory - overlapping
	if available < req.RoomCount {
		return nil, ErrNoRoomsLeft
	}
	if req.GuestsCount < 1 || (capacity > 0 && req.GuestsCount > capacity*req.RoomCount) {
		return nil, fmt.Errorf("guest count exceeds this room's capacity")
	}

	// 2d — build & insert booking.
	now := time.Now().UTC()
	nights := int(checkOut.Sub(checkIn).Hours() / 24)
	taxesAndFees := math.Round(pricePerNight*float64(nights)*float64(req.RoomCount)*0.12*100) / 100

	hotelShort := getHotelShortCode(req.HotelName, req.HotelID)
	roomNum := extractRoomNumber(req.RoomTypeName, req.RoomTypeID)
	prefix := fmt.Sprintf("%s/%d/%s/", hotelShort, now.Year(), roomNum)
	if err := s.repo.LockBookingCodePrefix(ctx, tx, prefix); err != nil {
		return nil, fmt.Errorf("lock booking code sequence: %w", err)
	}

	var count int
	_ = tx.QueryRow(ctx, "SELECT COUNT(*) FROM bookings WHERE booking_code LIKE $1", prefix+"%").Scan(&count)
	seq := count + 1

	bookingCode := fmt.Sprintf("%s%04d", prefix, seq)
	for attempt := 0; attempt < 100; attempt++ {
		candidate := fmt.Sprintf("%s%04d", prefix, seq+attempt)
		var exists bool
		_ = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_code = $1)", candidate).Scan(&exists)
		if !exists {
			bookingCode = candidate
			break
		}
	}

	booking := &models.Booking{
		ID:                uuid.New(),
		BookingCode:       bookingCode,
		UserID:            userID,
		HotelID:           req.HotelID,
		HotelName:         req.HotelName,
		RoomTypeID:        req.RoomTypeID,
		RoomTypeName:      req.RoomTypeName,
		CheckInDate:       checkIn,
		CheckOutDate:      checkOut,
		TotalNights:       nights,
		GuestsCount:       req.GuestsCount,
		RoomCount:         req.RoomCount,
		RoomPricePerNight: pricePerNight,
		TaxesAndFees:      taxesAndFees,
		TotalPrice:        (pricePerNight*float64(nights)*float64(req.RoomCount) + taxesAndFees),
		Status:            models.StatusPendingPayment,
		GuestFirstName:    req.GuestFirstName,
		GuestLastName:     req.GuestLastName,
		GuestEmail:        req.GuestEmail,
		GuestPhone:        req.GuestPhone,
		SpecialRequests:   req.SpecialRequests,
		ExpiresAt:         now.Add(10 * time.Minute),
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	if err := s.repo.CreateBooking(ctx, tx, booking); err != nil {
		return nil, fmt.Errorf("insert booking: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit transaction: %w", err)
	}

	// Redis stores a convenience TTL; the PostgreSQL expiry timestamp remains authoritative.
	if s.lock != nil {
		if err := s.lock.SetHold(ctx, booking.ID.String(), booking.BookingCode); err != nil {
			s.logger.Error("failed to set booking hold in Redis", "bookingID", booking.ID, "error", err)
			// Non-fatal: the DB record is authoritative; the hold is a convenience TTL.
		}
	}

	// Step 4 — Publish booking.held event to RabbitMQ
	if s.publisher != nil {
		userIDStr := ""
		if booking.UserID != nil {
			userIDStr = booking.UserID.String()
		}
		go func() {
			_ = s.publisher.Publish(context.Background(), "booking.held", BookingEvent{
				EventType:   "booking.held",
				BookingID:   booking.ID.String(),
				BookingCode: booking.BookingCode,
				UserID:      userIDStr,
				GuestEmail:  booking.GuestEmail,
				GuestName:   fmt.Sprintf("%s %s", booking.GuestFirstName, booking.GuestLastName),
				HotelName:   booking.HotelName,
				RoomType:    booking.RoomTypeName,
				CheckIn:     booking.CheckInDate.Format("2006-01-02"),
				CheckOut:    booking.CheckOutDate.Format("2006-01-02"),
				TotalPrice:  booking.TotalPrice,
			})
		}()
	}

	remaining := int(time.Until(booking.ExpiresAt).Seconds())
	return &models.HoldBookingResponse{
		Booking:          booking,
		ExpiresInSeconds: remaining,
	}, nil
}

// GetAvailabilityCalendar returns daily room inventory for inclusive calendar
// dates. Reservations use checkout-exclusive hotel night semantics.
func (s *BookingService) GetAvailabilityCalendar(ctx context.Context, roomTypeID, startDate, endDate string) (*AvailabilityCalendar, error) {
	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return nil, fmt.Errorf("invalid startDate format, expected YYYY-MM-DD")
	}
	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		return nil, fmt.Errorf("invalid endDate format, expected YYYY-MM-DD")
	}
	if end.Before(start) {
		return nil, fmt.Errorf("endDate must be on or after startDate")
	}
	if end.Sub(start) > 62*24*time.Hour {
		return nil, fmt.Errorf("availability calendar range cannot exceed 63 days")
	}
	if strings.TrimSpace(roomTypeID) == "" {
		return nil, fmt.Errorf("roomTypeId is required")
	}

	inventory, _, _, err := s.fetchInventory(ctx, roomTypeID)
	if err != nil {
		return nil, fmt.Errorf("inventory check: %w", err)
	}
	bookedDays, err := s.repo.GetAvailabilityCalendar(ctx, roomTypeID, start, end)
	if err != nil {
		return nil, fmt.Errorf("load availability calendar: %w", err)
	}
	days := make([]AvailabilityCalendarDay, 0, len(bookedDays))
	for _, day := range bookedDays {
		available := inventory - day.BookedInventory
		if available < 0 {
			available = 0
		}
		status := "AVAILABLE"
		if available == 0 {
			status = "FULL"
		} else if available <= int(math.Ceil(float64(inventory)*0.3)) {
			status = "LIMITED"
		} else if day.BookedInventory > 0 {
			status = "PARTIALLY_BOOKED"
		}
		days = append(days, AvailabilityCalendarDay{
			Date:               day.Date.Format("2006-01-02"),
			BookedInventory:    day.BookedInventory,
			AvailableInventory: available,
			IsAvailable:        available > 0,
			Status:             status,
		})
	}
	return &AvailabilityCalendar{
		RoomTypeID:     roomTypeID,
		StartDate:      startDate,
		EndDate:        endDate,
		TotalInventory: inventory,
		Days:           days,
	}, nil
}

// ConfirmBooking transitions a booking from PENDING_PAYMENT to CONFIRMED.
// Intended to be called by the Payment Service after successful payment.
func (s *BookingService) ConfirmBooking(ctx context.Context, bookingID uuid.UUID) (*models.Booking, error) {
	booking, err := s.repo.GetBookingByID(ctx, bookingID)
	if err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			return nil, ErrBookingNotFound
		}
		return nil, err
	}

	if booking.Status == models.StatusConfirmed {
		return booking, nil // idempotent
	}

	if booking.Status != models.StatusPendingPayment {
		return nil, fmt.Errorf("cannot confirm booking in status %q", booking.Status)
	}

	confirmed, err := s.repo.ConfirmPendingBooking(ctx, bookingID)
	if err != nil {
		return nil, err
	}
	if !confirmed {
		latest, getErr := s.repo.GetBookingByID(ctx, bookingID)
		if getErr != nil {
			return nil, getErr
		}
		if latest.Status == models.StatusConfirmed {
			return latest, nil
		}
		return nil, fmt.Errorf("booking hold has expired and can no longer be confirmed")
	}

	// Remove the Redis hold since payment is complete.
	if err := s.lock.RemoveHold(ctx, bookingID.String()); err != nil {
		s.logger.Warn("failed to remove booking hold from Redis", "bookingID", bookingID, "error", err)
	}

	booking.Status = models.StatusConfirmed

	// Publish booking.confirmed event to RabbitMQ
	if s.publisher != nil {
		userIDStr := ""
		if booking.UserID != nil {
			userIDStr = booking.UserID.String()
		}
		go func() {
			_ = s.publisher.Publish(context.Background(), "booking.confirmed", BookingEvent{
				EventType:   "booking.confirmed",
				BookingID:   booking.ID.String(),
				BookingCode: booking.BookingCode,
				UserID:      userIDStr,
				GuestEmail:  booking.GuestEmail,
				GuestName:   fmt.Sprintf("%s %s", booking.GuestFirstName, booking.GuestLastName),
				HotelName:   booking.HotelName,
				RoomType:    booking.RoomTypeName,
				CheckIn:     booking.CheckInDate.Format("2006-01-02"),
				CheckOut:    booking.CheckOutDate.Format("2006-01-02"),
				TotalPrice:  booking.TotalPrice,
			})
		}()
	}

	return booking, nil
}

// CancelBooking transitions a booking to CANCELLED.
// requesterID must match booking.UserID unless it is nil (guest checkout).
func (s *BookingService) CancelBooking(ctx context.Context, bookingID uuid.UUID, requesterID *uuid.UUID) error {
	booking, err := s.repo.GetBookingByID(ctx, bookingID)
	if err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			return ErrBookingNotFound
		}
		return err
	}

	// Authorisation: registered-user bookings can only be cancelled by the owner.
	if booking.UserID != nil && requesterID != nil && *booking.UserID != *requesterID {
		return ErrNotAuthorized
	}

	switch booking.Status {
	case models.StatusCancelled, models.StatusExpired, models.StatusCheckedOut:
		return fmt.Errorf("booking with status %q cannot be cancelled", booking.Status)
	case models.StatusCheckedIn:
		return fmt.Errorf("cannot cancel a booking that is already checked-in")
	}

	if err := s.repo.UpdateStatus(ctx, bookingID, models.StatusCancelled); err != nil {
		return err
	}

	_ = s.lock.RemoveHold(ctx, bookingID.String())
	return nil
}

// ExpireStaleBookings is meant to be called on a periodic schedule (e.g. every minute).
// It marks all PENDING_PAYMENT bookings whose expires_at has passed as EXPIRED.
func (s *BookingService) ExpireStaleBookings(ctx context.Context) {
	n, err := s.repo.ExpireStaleBookings(ctx)
	if err != nil {
		s.logger.Error("expire stale bookings failed", "error", err)
		return
	}
	if n > 0 {
		s.logger.Info("expired stale bookings", "count", n)
	}
}

// GetBookingByID returns a single booking by its UUID.
func (s *BookingService) GetBookingByID(ctx context.Context, id uuid.UUID) (*models.Booking, error) {
	b, err := s.repo.GetBookingByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			return nil, ErrBookingNotFound
		}
		return nil, err
	}
	return b, nil
}

// GetBookingByCode returns a single booking by its human-readable code.
func (s *BookingService) GetBookingByCode(ctx context.Context, code string) (*models.Booking, error) {
	b, err := s.repo.GetBookingByCode(ctx, code)
	if err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			return nil, ErrBookingNotFound
		}
		return nil, err
	}
	return b, nil
}

func (s *BookingService) GetAdminBookings(ctx context.Context, page, limit int) (*models.BookingListResponse, error) {
	bookings, err := s.repo.GetAllBookings(ctx)
	if err != nil {
		return nil, fmt.Errorf("list bookings: %w", err)
	}
	total := len(bookings)
	if limit <= 0 {
		return &models.BookingListResponse{
			Bookings:   bookings,
			Total:      total,
			Page:       1,
			Limit:      total,
			TotalPages: 1,
		}, nil
	}
	if page <= 0 {
		page = 1
	}
	totalPages := (total + limit - 1) / limit
	if totalPages == 0 {
		totalPages = 1
	}
	start := (page - 1) * limit
	if start > total {
		start = total
	}
	end := start + limit
	if end > total {
		end = total
	}
	return &models.BookingListResponse{
		Bookings:   bookings[start:end],
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

// GetUserBookings returns all bookings for a given user.
func (s *BookingService) GetUserBookings(ctx context.Context, userID uuid.UUID) ([]*models.Booking, error) {
	return s.repo.GetBookingsByUser(ctx, userID)
}

// GetOverlappingCount is the internal availability query exposed to Hotel Service.
func (s *BookingService) GetOverlappingCount(ctx context.Context, roomTypeID, checkIn, checkOut string) (int, error) {
	ciTime, err := time.Parse("2006-01-02", checkIn)
	if err != nil {
		return 0, fmt.Errorf("invalid check_in: %w", err)
	}
	coTime, err := time.Parse("2006-01-02", checkOut)
	if err != nil {
		return 0, fmt.Errorf("invalid check_out: %w", err)
	}
	if !coTime.After(ciTime) || coTime.Sub(ciTime) > 365*24*time.Hour {
		return 0, fmt.Errorf("availability range must be between 1 and 365 nights")
	}
	return s.repo.GetOverlappingCount(ctx, nil, roomTypeID, ciTime, coTime)
}

// --------------------------------------------------------------------------
// QR Check-In
// --------------------------------------------------------------------------

// qrPassSecret returns the JWT signing secret from env or a safe default.
func qrPassSecret() string {
	if s := os.Getenv("JWT_ACCESS_SECRET"); s != "" {
		return s
	}
	return "hotel-jwt-secret-key-2026"
}

// GenerateQRPass creates a signed HMAC-SHA256 JWT pass for a confirmed booking.
// The pass expires 48 h after check-in (plenty of time for the front-desk scan).
func (s *BookingService) GenerateQRPass(ctx context.Context, bookingID uuid.UUID) (string, *models.Booking, error) {
	booking, err := s.repo.GetBookingByID(ctx, bookingID)
	if err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			return "", nil, ErrBookingNotFound
		}
		return "", nil, err
	}
	if booking.Status != models.StatusConfirmed && booking.Status != models.StatusCheckedIn {
		return "", nil, fmt.Errorf("QR pass is only available for CONFIRMED or CHECKED_IN bookings (current: %s)", booking.Status)
	}

	now := time.Now().UTC()
	exp := booking.CheckInDate.Add(48 * time.Hour).Unix()
	if exp < now.Unix() {
		// booking is in the past — extend to now+1h so staff can still scan
		exp = now.Add(1 * time.Hour).Unix()
	}

	claims := utils.QRPassClaims{
		Sub:          booking.ID.String(),
		BookingCode:  booking.BookingCode,
		HotelID:      booking.HotelID,
		HotelName:    booking.HotelName,
		RoomTypeID:   booking.RoomTypeID,
		RoomTypeName: booking.RoomTypeName,
		GuestName:    strings.TrimSpace(booking.GuestFirstName + " " + booking.GuestLastName),
		GuestEmail:   booking.GuestEmail,
		CheckInDate:  booking.CheckInDate.Format("2006-01-02"),
		CheckOutDate: booking.CheckOutDate.Format("2006-01-02"),
		TotalNights:  booking.TotalNights,
		RoomCount:    booking.RoomCount,
		IssuedAt:     now.Unix(),
		ExpiresAt:    exp,
	}

	token, err := utils.SignQRPass(qrPassSecret(), claims)
	if err != nil {
		return "", nil, fmt.Errorf("sign QR pass: %w", err)
	}
	return token, booking, nil
}

// CheckInByQR verifies a QR pass token and transitions the booking to CHECKED_IN.
func (s *BookingService) CheckInByQR(ctx context.Context, token string) (*models.Booking, bool, error) {
	claims, err := utils.VerifyQRPass(qrPassSecret(), token)
	if err != nil {
		if errors.Is(err, utils.ErrQRPassExpired) {
			return nil, false, fmt.Errorf("QR pass has expired — please ask the guest to refresh their pass")
		}
		return nil, false, fmt.Errorf("invalid QR pass: %w", err)
	}

	bookingID, err := uuid.Parse(claims.Sub)
	if err != nil {
		return nil, false, fmt.Errorf("malformed booking ID in QR pass")
	}

	booking, err := s.repo.GetBookingByID(ctx, bookingID)
	if err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			return nil, false, ErrBookingNotFound
		}
		return nil, false, err
	}

	alreadyCheckedIn := booking.Status == models.StatusCheckedIn
	if alreadyCheckedIn {
		return booking, true, nil // idempotent
	}

	if booking.Status != models.StatusConfirmed {
		return booking, false, fmt.Errorf("cannot check in a booking with status %q", booking.Status)
	}

	if err := s.repo.UpdateStatus(ctx, bookingID, models.StatusCheckedIn); err != nil {
		return nil, false, fmt.Errorf("update status: %w", err)
	}
	booking.Status = models.StatusCheckedIn

	// Publish checked-in event
	if s.publisher != nil {
		userIDStr := ""
		if booking.UserID != nil {
			userIDStr = booking.UserID.String()
		}
		go func() {
			_ = s.publisher.Publish(context.Background(), "booking.checked_in", BookingEvent{
				EventType:   "booking.checked_in",
				BookingID:   booking.ID.String(),
				BookingCode: booking.BookingCode,
				UserID:      userIDStr,
				GuestEmail:  booking.GuestEmail,
				GuestName:   strings.TrimSpace(booking.GuestFirstName + " " + booking.GuestLastName),
				HotelName:   booking.HotelName,
				RoomType:    booking.RoomTypeName,
				CheckIn:     booking.CheckInDate.Format("2006-01-02"),
				CheckOut:    booking.CheckOutDate.Format("2006-01-02"),
				TotalPrice:  booking.TotalPrice,
			})
		}()
	}

	return booking, false, nil
}

// --------------------------------------------------------------------------
// helpers
// --------------------------------------------------------------------------

// fetchInventory gets room inventory and its authoritative nightly price.
func (s *BookingService) fetchInventory(ctx context.Context, roomTypeID string) (int, float64, int, error) {
	url := fmt.Sprintf("%s/internal/rooms/%s/inventory", s.hotelServiceURL, roomTypeID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("build inventory request: %w", err)
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("call hotel service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return 0, 0, 0, fmt.Errorf("hotel service returned %d: %s", resp.StatusCode, body)
	}

	var inv inventoryResponse
	if err := json.NewDecoder(resp.Body).Decode(&inv); err != nil {
		return 0, 0, 0, fmt.Errorf("decode inventory response: %w", err)
	}
	return inv.Inventory, inv.PricePerNight, inv.Capacity, nil
}

// getHotelShortCode extracts a 2-4 letter uppercase short code from hotel name or hotel ID.
func getHotelShortCode(name string, id string) string {
	clean := strings.TrimSpace(name)
	if clean == "" {
		clean = strings.TrimSpace(id)
	}
	if clean == "" {
		return "HTL"
	}

	words := strings.FieldsFunc(clean, func(r rune) bool {
		return r == ' ' || r == '-' || r == '_'
	})

	if len(words) > 1 {
		var sb strings.Builder
		for _, w := range words {
			w = strings.TrimSpace(w)
			if len(w) > 0 {
				sb.WriteRune(unicode.ToUpper(rune(w[0])))
			}
			if sb.Len() >= 4 {
				break
			}
		}
		if sb.Len() >= 2 {
			return sb.String()
		}
	}

	var letters []rune
	for _, r := range clean {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			letters = append(letters, unicode.ToUpper(r))
		}
	}
	if len(letters) >= 3 {
		return string(letters[:3])
	}
	if len(letters) > 0 {
		return string(letters)
	}
	return "HTL"
}

// extractRoomNumber extracts 2-4 numeric digits from room type name, room ID, or defaults to 101.
func extractRoomNumber(roomTypeName string, roomTypeID string) string {
	var digits []rune
	for _, r := range roomTypeName {
		if unicode.IsDigit(r) {
			digits = append(digits, r)
		}
	}
	if len(digits) >= 2 {
		if len(digits) > 4 {
			return string(digits[:4])
		}
		return string(digits)
	}
	digits = nil
	for _, r := range roomTypeID {
		if unicode.IsDigit(r) {
			digits = append(digits, r)
		}
	}
	if len(digits) >= 3 {
		return string(digits[:3])
	}
	return "101"
}

// generateBookingCode returns "SE-" followed by 6 random chars from bookingCodeChars.
func generateBookingCode() string {
	const length = 6
	code := make([]byte, length)
	for i := range code {
		code[i] = bookingCodeChars[rand.Intn(len(bookingCodeChars))]
	}
	return "SE-" + string(code)
}
