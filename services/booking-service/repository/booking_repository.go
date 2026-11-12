package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"booking-service/models"
)

// ErrBookingNotFound is returned when a lookup yields no rows.
var ErrBookingNotFound = errors.New("booking not found")

// BookingRepository handles all PostgreSQL operations for the bookings table.
type BookingRepository struct {
	db *pgxpool.Pool
}

// NewBookingRepository creates a repository backed by the given pool.
func NewBookingRepository(db *pgxpool.Pool) *BookingRepository {
	return &BookingRepository{db: db}
}

// CreateBooking inserts a new booking record inside the provided transaction.
func (r *BookingRepository) CreateBooking(ctx context.Context, tx pgx.Tx, b *models.Booking) error {
	const q = `
		INSERT INTO bookings (
			id, booking_code, user_id,
			hotel_id, hotel_name, room_type_id, room_type_name,
			check_in_date, check_out_date, total_nights,
			guests_count, room_count,
			room_price_per_night, taxes_and_fees, total_price,
			status,
			guest_first_name, guest_last_name, guest_email, guest_phone,
			special_requests, expires_at, created_at, updated_at
		) VALUES (
			$1, $2, $3,
			$4, $5, $6, $7,
			$8, $9, $10,
			$11, $12,
			$13, $14, $15,
			$16,
			$17, $18, $19, $20,
			$21, $22, $23, $24
		)`

	_, err := tx.Exec(ctx, q,
		b.ID, b.BookingCode, b.UserID,
		b.HotelID, b.HotelName, b.RoomTypeID, b.RoomTypeName,
		b.CheckInDate, b.CheckOutDate, b.TotalNights,
		b.GuestsCount, b.RoomCount,
		b.RoomPricePerNight, b.TaxesAndFees, b.TotalPrice,
		b.Status,
		b.GuestFirstName, b.GuestLastName, b.GuestEmail, b.GuestPhone,
		b.SpecialRequests, b.ExpiresAt, b.CreatedAt, b.UpdatedAt,
	)
	return err
}

// GetBookingByID fetches a booking by its UUID primary key.
func (r *BookingRepository) GetBookingByID(ctx context.Context, id uuid.UUID) (*models.Booking, error) {
	const q = `SELECT ` + bookingColumns + ` FROM bookings WHERE id = $1`
	row := r.db.QueryRow(ctx, q, id)
	return scanBooking(row)
}

// GetBookingByCode fetches a booking by its human-readable booking code.
func (r *BookingRepository) GetBookingByCode(ctx context.Context, code string) (*models.Booking, error) {
	const q = `SELECT ` + bookingColumns + ` FROM bookings WHERE booking_code = $1`
	row := r.db.QueryRow(ctx, q, code)
	return scanBooking(row)
}

// GetAllBookings returns bookings newest-first for the administrator workspace.
func (r *BookingRepository) GetAllBookings(ctx context.Context) ([]*models.Booking, error) {
	const q = `SELECT ` + bookingColumns + ` FROM bookings ORDER BY created_at DESC`
	return r.queryBookings(ctx, q)
}

// GetBookingsByUser returns all bookings belonging to a specific user, ordered by creation date.
func (r *BookingRepository) GetBookingsByUser(ctx context.Context, userID uuid.UUID) ([]*models.Booking, error) {
	const q = `SELECT ` + bookingColumns + ` FROM bookings WHERE user_id = $1 ORDER BY created_at DESC`
	return r.queryBookings(ctx, q, userID)
}

// GetBookingsByHotel returns all active bookings for a specific hotel.
func (r *BookingRepository) GetBookingsByHotel(ctx context.Context, hotelID string) ([]*models.Booking, error) {
	const q = `SELECT ` + bookingColumns + ` FROM bookings WHERE hotel_id = $1 ORDER BY check_in_date ASC`
	return r.queryBookings(ctx, q, hotelID)
}

// UpdateStatus transitions a booking to a new status and bumps updated_at.
func (r *BookingRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status models.BookingStatus) error {
	const q = `UPDATE bookings SET status = $1, updated_at = $2 WHERE id = $3`
	tag, err := r.db.Exec(ctx, q, status, time.Now().UTC(), id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrBookingNotFound
	}
	return nil
}

// UpdateStatusTx is UpdateStatus but operates inside a caller-managed transaction.
func (r *BookingRepository) UpdateStatusTx(ctx context.Context, tx pgx.Tx, id uuid.UUID, status models.BookingStatus) error {
	const q = `UPDATE bookings SET status = $1, updated_at = $2 WHERE id = $3`
	tag, err := tx.Exec(ctx, q, status, time.Now().UTC(), id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrBookingNotFound
	}
	return nil
}

// GetOverlappingCount counts active bookings for a room type that overlap with
// the requested date range. Used for availability checks before holding a room.
func (r *BookingRepository) GetOverlappingCount(
	ctx context.Context,
	tx pgx.Tx,
	roomTypeID string,
	checkIn, checkOut time.Time,
) (int, error) {
	const q = `
		SELECT COALESCE(SUM(room_count), 0)
		FROM   bookings
		WHERE  room_type_id = $1
		  AND  status IN ('PENDING_PAYMENT','CONFIRMED','CHECKED_IN')
		  AND  check_in_date  < $3
		  AND  check_out_date > $2`

	var count int
	var err error
	if tx != nil {
		err = tx.QueryRow(ctx, q, roomTypeID, checkIn, checkOut).Scan(&count)
	} else {
		err = r.db.QueryRow(ctx, q, roomTypeID, checkIn, checkOut).Scan(&count)
	}
	return count, err
}

// ExpireStaleBookings transitions PENDING_PAYMENT bookings whose expires_at has
// passed into EXPIRED status. Returns the number of rows updated.
func (r *BookingRepository) ExpireStaleBookings(ctx context.Context) (int64, error) {
	const q = `
		UPDATE bookings
		SET    status     = 'EXPIRED',
		       updated_at = NOW()
		WHERE  status    = 'PENDING_PAYMENT'
		  AND  expires_at < NOW()`

	tag, err := r.db.Exec(ctx, q)
	if err != nil {
		return 0, fmt.Errorf("expire stale bookings: %w", err)
	}
	return tag.RowsAffected(), nil
}

// BeginTx starts a serializable transaction using the pool.
func (r *BookingRepository) BeginTx(ctx context.Context) (pgx.Tx, error) {
	return r.db.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable})
}

// --------------------------------------------------------------------------
// helpers
// --------------------------------------------------------------------------

const bookingColumns = `
	id, booking_code, user_id,
	hotel_id, hotel_name, room_type_id, room_type_name,
	check_in_date, check_out_date, total_nights,
	guests_count, room_count,
	room_price_per_night, taxes_and_fees, total_price,
	status,
	guest_first_name, guest_last_name, guest_email, guest_phone,
	special_requests, expires_at, created_at, updated_at`

func scanBooking(row pgx.Row) (*models.Booking, error) {
	b := &models.Booking{}
	err := row.Scan(
		&b.ID, &b.BookingCode, &b.UserID,
		&b.HotelID, &b.HotelName, &b.RoomTypeID, &b.RoomTypeName,
		&b.CheckInDate, &b.CheckOutDate, &b.TotalNights,
		&b.GuestsCount, &b.RoomCount,
		&b.RoomPricePerNight, &b.TaxesAndFees, &b.TotalPrice,
		&b.Status,
		&b.GuestFirstName, &b.GuestLastName, &b.GuestEmail, &b.GuestPhone,
		&b.SpecialRequests, &b.ExpiresAt, &b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrBookingNotFound
		}
		return nil, err
	}
	return b, nil
}

func (r *BookingRepository) queryBookings(ctx context.Context, q string, args ...any) ([]*models.Booking, error) {
	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	bookings := make([]*models.Booking, 0)
	for rows.Next() {
		b := &models.Booking{}
		if err := rows.Scan(
			&b.ID, &b.BookingCode, &b.UserID,
			&b.HotelID, &b.HotelName, &b.RoomTypeID, &b.RoomTypeName,
			&b.CheckInDate, &b.CheckOutDate, &b.TotalNights,
			&b.GuestsCount, &b.RoomCount,
			&b.RoomPricePerNight, &b.TaxesAndFees, &b.TotalPrice,
			&b.Status,
			&b.GuestFirstName, &b.GuestLastName, &b.GuestEmail, &b.GuestPhone,
			&b.SpecialRequests, &b.ExpiresAt, &b.CreatedAt, &b.UpdatedAt,
		); err != nil {
			return nil, err
		}
		bookings = append(bookings, b)
	}
	return bookings, rows.Err()
}
