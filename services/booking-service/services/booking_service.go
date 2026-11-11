package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"math/rand"
	"net/http"
	"time"

	"github.com/google/uuid"

	"booking-service/models"
	"booking-service/repository"
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

// inventoryResponse is the payload returned by the Hotel Service inventory endpoint.
type inventoryResponse struct {
	Inventory int `json:"inventory"`
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

// HoldRoom implements the double-booking prevention algorithm:
//  1. Acquire Redis lock (5 s TTL)
//  2. Inside a serialisable transaction:
//     a. Count overlapping active bookings
//     b. Fetch total inventory from Hotel Service
//     c. If (inventory - overlap) < roomCount → reject
//     d. INSERT booking with PENDING_PAYMENT, expires_at = now+10min
//  3. Store Redis hold (600 s TTL)
//  4. Release lock
func (s *BookingService) HoldRoom(ctx context.Context, req *models.HoldBookingRequest, userID *uuid.UUID) (*models.HoldBookingResponse, error) {
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
	if req.RoomCount < 1 {
		return nil, fmt.Errorf("room_count must be at least 1")
	}

	// Step 1 — acquire distributed lock.
	acquired, err := s.lock.AcquireLock(ctx, req.RoomTypeID, req.CheckInDate, req.CheckOutDate)
	if err != nil {
		return nil, fmt.Errorf("lock error: %w", err)
	}
	if !acquired {
		return nil, ErrLockUnavailable
	}
	defer func() {
		if releaseErr := s.lock.ReleaseLock(context.Background(), req.RoomTypeID, req.CheckInDate, req.CheckOutDate); releaseErr != nil {
			s.logger.Error("failed to release lock", "error", releaseErr)
		}
	}()

	// Step 2 — serialisable transaction.
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	// 2a — overlapping bookings.
	overlapping, err := s.repo.GetOverlappingCount(ctx, tx, req.RoomTypeID, checkIn, checkOut)
	if err != nil {
		return nil, fmt.Errorf("overlap check: %w", err)
	}

	// 2b — inventory from Hotel Service.
	inventory, err := s.fetchInventory(ctx, req.RoomTypeID)
	if err != nil {
		return nil, fmt.Errorf("inventory check: %w", err)
	}

	// 2c — availability gate.
	available := inventory - overlapping
	if available < req.RoomCount {
		return nil, ErrNoRoomsLeft
	}

	// 2d — build & insert booking.
	now := time.Now().UTC()
	nights := int(checkOut.Sub(checkIn).Hours() / 24)
	booking := &models.Booking{
		ID:                uuid.New(),
		BookingCode:       generateBookingCode(),
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
		RoomPricePerNight: req.RoomPricePerNight,
		TaxesAndFees:      req.TaxesAndFees,
		TotalPrice:        (req.RoomPricePerNight*float64(nights)*float64(req.RoomCount) + req.TaxesAndFees),
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

	// Step 3 — Redis hold.
	if err := s.lock.SetHold(ctx, booking.ID.String(), booking.BookingCode); err != nil {
		s.logger.Error("failed to set booking hold in Redis", "bookingID", booking.ID, "error", err)
		// Non-fatal: the DB record is authoritative; the hold is a convenience TTL.
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

	if time.Now().After(booking.ExpiresAt) {
		_ = s.repo.UpdateStatus(ctx, bookingID, models.StatusExpired)
		return nil, fmt.Errorf("booking hold has expired")
	}

	if err := s.repo.UpdateStatus(ctx, bookingID, models.StatusConfirmed); err != nil {
		return nil, err
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
	return s.repo.GetOverlappingCount(ctx, nil, roomTypeID, ciTime, coTime)
}

// --------------------------------------------------------------------------
// helpers
// --------------------------------------------------------------------------

// fetchInventory calls the Hotel Service to retrieve the total room inventory.
func (s *BookingService) fetchInventory(ctx context.Context, roomTypeID string) (int, error) {
	url := fmt.Sprintf("%s/internal/rooms/%s/inventory", s.hotelServiceURL, roomTypeID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return 0, fmt.Errorf("build inventory request: %w", err)
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return 0, fmt.Errorf("call hotel service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return 0, fmt.Errorf("hotel service returned %d: %s", resp.StatusCode, body)
	}

	var inv inventoryResponse
	if err := json.NewDecoder(resp.Body).Decode(&inv); err != nil {
		return 0, fmt.Errorf("decode inventory response: %w", err)
	}
	return inv.Inventory, nil
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
