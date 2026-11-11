package models

import (
	"time"

	"github.com/google/uuid"
)

// BookingStatus represents the lifecycle state of a booking.
type BookingStatus string

const (
	StatusPendingPayment BookingStatus = "PENDING_PAYMENT"
	StatusConfirmed      BookingStatus = "CONFIRMED"
	StatusCancelled      BookingStatus = "CANCELLED"
	StatusExpired        BookingStatus = "EXPIRED"
	StatusCheckedIn      BookingStatus = "CHECKED_IN"
	StatusCheckedOut     BookingStatus = "CHECKED_OUT"
)

// Booking is the central domain entity persisted in PostgreSQL.
type Booking struct {
	ID               uuid.UUID     `json:"id"`
	BookingCode      string        `json:"booking_code"`
	UserID           *uuid.UUID    `json:"user_id,omitempty"` // nil for guest checkout
	HotelID          string        `json:"hotel_id"`
	HotelName        string        `json:"hotel_name"`
	RoomTypeID       string        `json:"room_type_id"`
	RoomTypeName     string        `json:"room_type_name"`
	CheckInDate      time.Time     `json:"check_in_date"`
	CheckOutDate     time.Time     `json:"check_out_date"`
	TotalNights      int           `json:"total_nights"`
	GuestsCount      int           `json:"guests_count"`
	RoomCount        int           `json:"room_count"`
	RoomPricePerNight float64      `json:"room_price_per_night"`
	TaxesAndFees     float64       `json:"taxes_and_fees"`
	TotalPrice       float64       `json:"total_price"`
	Status           BookingStatus `json:"status"`
	GuestFirstName   string        `json:"guest_first_name"`
	GuestLastName    string        `json:"guest_last_name"`
	GuestEmail       string        `json:"guest_email"`
	GuestPhone       string        `json:"guest_phone"`
	SpecialRequests  string        `json:"special_requests,omitempty"`
	ExpiresAt        time.Time     `json:"expires_at"`
	CreatedAt        time.Time     `json:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at"`
}

// HoldBookingRequest is the inbound payload for the hold-room endpoint.
type HoldBookingRequest struct {
	HotelID           string  `json:"hotel_id"`
	HotelName         string  `json:"hotel_name"`
	RoomTypeID        string  `json:"room_type_id"`
	RoomTypeName      string  `json:"room_type_name"`
	CheckInDate       string  `json:"check_in_date"`  // "YYYY-MM-DD"
	CheckOutDate      string  `json:"check_out_date"` // "YYYY-MM-DD"
	GuestsCount       int     `json:"guests_count"`
	RoomCount         int     `json:"room_count"`
	RoomPricePerNight float64 `json:"room_price_per_night"`
	TaxesAndFees      float64 `json:"taxes_and_fees"`
	GuestFirstName    string  `json:"guest_first_name"`
	GuestLastName     string  `json:"guest_last_name"`
	GuestEmail        string  `json:"guest_email"`
	GuestPhone        string  `json:"guest_phone"`
	SpecialRequests   string  `json:"special_requests,omitempty"`
}

// HoldBookingResponse is returned after a successful hold, including a countdown.
type HoldBookingResponse struct {
	Booking          *Booking `json:"booking"`
	ExpiresInSeconds int      `json:"expires_in_seconds"`
}

// BookingListResponse wraps a paginated list of bookings.
type BookingListResponse struct {
	Bookings []*Booking `json:"bookings"`
	Total    int        `json:"total"`
}
