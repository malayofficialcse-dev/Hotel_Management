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
	ID                uuid.UUID     `json:"id"`
	BookingCode       string        `json:"booking_code"`
	UserID            *uuid.UUID    `json:"user_id,omitempty"` // nil for guest checkout
	HotelID           string        `json:"hotel_id"`
	HotelName         string        `json:"hotel_name"`
	RoomTypeID        string        `json:"room_type_id"`
	RoomTypeName      string        `json:"room_type_name"`
	CheckInDate       time.Time     `json:"check_in_date"`
	CheckOutDate      time.Time     `json:"check_out_date"`
	TotalNights       int           `json:"total_nights"`
	GuestsCount       int           `json:"guests_count"`
	RoomCount         int           `json:"room_count"`
	RoomPricePerNight float64       `json:"room_price_per_night"`
	TaxesAndFees      float64       `json:"taxes_and_fees"`
	TotalPrice        float64       `json:"total_price"`
	Status            BookingStatus `json:"status"`
	GuestFirstName    string        `json:"guest_first_name"`
	GuestLastName     string        `json:"guest_last_name"`
	GuestEmail        string        `json:"guest_email"`
	GuestPhone        string        `json:"guest_phone"`
	SpecialRequests   string        `json:"special_requests,omitempty"`
	ExpiresAt         time.Time     `json:"expires_at"`
	CreatedAt         time.Time     `json:"created_at"`
	UpdatedAt         time.Time     `json:"updated_at"`
}

type GuestServiceRequest struct {
	ID          uuid.UUID `json:"id"`
	BookingID   uuid.UUID `json:"bookingId"`
	UserID      uuid.UUID `json:"-"`
	RequestType string    `json:"requestType"`
	Details     string    `json:"details"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	HotelID     string    `json:"hotelId,omitempty"`
	HotelName   string    `json:"hotelName,omitempty"`
	BookingCode string    `json:"bookingCode,omitempty"`
	GuestName   string    `json:"guestName,omitempty"`
	GuestEmail  string    `json:"guestEmail,omitempty"`
	CheckIn     time.Time `json:"checkIn,omitempty"`
	CheckOut    time.Time `json:"checkOut,omitempty"`
}

type UpdateBookingRequest struct {
	CheckInDate     *string `json:"checkInDate"`
	CheckOutDate    *string `json:"checkOutDate"`
	GuestsCount     *int    `json:"guestsCount"`
	RoomCount       *int    `json:"roomCount"`
	GuestFirstName  *string `json:"guestFirstName"`
	GuestLastName   *string `json:"guestLastName"`
	GuestPhone      *string `json:"guestPhone"`
	SpecialRequests *string `json:"specialRequests"`
}

type GuestNotification struct {
	ID        uuid.UUID  `json:"id"`
	BookingID *uuid.UUID `json:"bookingId,omitempty"`
	EventType string     `json:"eventType"`
	Title     string     `json:"title"`
	Message   string     `json:"message"`
	CreatedAt time.Time  `json:"createdAt"`
	ReadAt    *time.Time `json:"readAt,omitempty"`
}

// HoldBookingRequest is the inbound payload for the hold-room endpoint.
type HoldBookingRequest struct {
	HotelID            string  `json:"hotel_id"`
	HotelIDAlt         string  `json:"hotelId"`
	HotelName          string  `json:"hotel_name"`
	HotelNameAlt       string  `json:"hotelName"`
	RoomTypeID         string  `json:"room_type_id"`
	RoomID             string  `json:"room_id"`
	RoomTypeIDAlt      string  `json:"roomTypeId"`
	RoomTypeName       string  `json:"room_type_name"`
	RoomTypeNameAlt    string  `json:"roomTypeName"`
	CheckInDate        string  `json:"check_in_date"` // "YYYY-MM-DD"
	CheckIn            string  `json:"check_in"`
	CheckInDateAlt     string  `json:"checkInDate"`
	CheckOutDate       string  `json:"check_out_date"` // "YYYY-MM-DD"
	CheckOut           string  `json:"check_out"`
	CheckOutDateAlt    string  `json:"checkOutDate"`
	GuestsCount        int     `json:"guests_count"`
	GuestsCountAlt     int     `json:"guestsCount"`
	RoomCount          int     `json:"room_count"`
	RoomCountAlt       int     `json:"roomCount"`
	RoomPricePerNight  float64 `json:"room_price_per_night"`
	TaxesAndFees       float64 `json:"taxes_and_fees"`
	GuestFirstName     string  `json:"guest_first_name"`
	GuestFirstNameAlt  string  `json:"guestFirstName"`
	GuestLastName      string  `json:"guest_last_name"`
	GuestLastNameAlt   string  `json:"guestLastName"`
	GuestName          string  `json:"guest_name"`
	GuestEmail         string  `json:"guest_email"`
	GuestEmailAlt      string  `json:"guestEmail"`
	GuestPhone         string  `json:"guest_phone"`
	GuestPhoneAlt      string  `json:"guestPhone"`
	SpecialRequests    string  `json:"special_requests,omitempty"`
	SpecialRequestsAlt string  `json:"specialRequests,omitempty"`
}

// HoldBookingResponse is returned after a successful hold, including a countdown.
type HoldBookingResponse struct {
	Booking          *Booking `json:"booking"`
	ExpiresInSeconds int      `json:"expires_in_seconds"`
}

// BookingListResponse wraps a paginated list of bookings.
type BookingListResponse struct {
	Bookings   []*Booking `json:"bookings"`
	Total      int        `json:"total"`
	Page       int        `json:"page,omitempty"`
	Limit      int        `json:"limit,omitempty"`
	TotalPages int        `json:"total_pages,omitempty"`
}
