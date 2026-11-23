package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"booking-service/models"
)

// ErrBookingNotFound is returned when a lookup yields no rows.
var ErrBookingNotFound = errors.New("booking not found")
var ErrNoRoomsLeft = errors.New("no rooms available for the requested dates and count")

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

// GetNextBookingSequence counts bookings for the hotel and year to produce the next sequential booking number.
func (r *BookingRepository) GetNextBookingSequence(ctx context.Context, tx pgx.Tx, hotelID string, year int) (int, error) {
	const q = `
		SELECT COUNT(*) 
		FROM bookings 
		WHERE (hotel_id = $1 OR hotel_name = $1)
		  AND EXTRACT(YEAR FROM created_at) = $2
	`
	var count int
	row := tx.QueryRow(ctx, q, hotelID, year)
	if err := row.Scan(&count); err != nil {
		return 1, err
	}
	return count + 1, nil
}

// GetBookingByID fetches a booking by its UUID primary key.
func (r *BookingRepository) GetBookingByID(ctx context.Context, id uuid.UUID) (*models.Booking, error) {
	const q = `SELECT ` + bookingColumns + ` FROM bookings WHERE id = $1`
	row := r.db.QueryRow(ctx, q, id)
	return scanBooking(row)
}

func (r *BookingRepository) CreateGuestServiceRequest(ctx context.Context, bookingID, userID uuid.UUID, requestType, details string) (*models.GuestServiceRequest, error) {
	request := &models.GuestServiceRequest{ID: uuid.New(), BookingID: bookingID, UserID: userID, RequestType: requestType, Details: details, Status: "OPEN"}
	err := r.db.QueryRow(ctx, `
		INSERT INTO guest_service_requests (id, booking_id, user_id, request_type, details, status)
		SELECT $1, b.id, $2, $4, $5, 'OPEN' FROM bookings b
		WHERE b.id = $3 AND b.user_id = $2 AND b.status IN ('CONFIRMED', 'CHECKED_IN')
		RETURNING created_at, updated_at`, request.ID, userID, bookingID, requestType, details).Scan(&request.CreatedAt, &request.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return request, nil
}

func (r *BookingRepository) ListGuestServiceRequests(ctx context.Context, bookingID, userID uuid.UUID) ([]*models.GuestServiceRequest, error) {
	rows, err := r.db.Query(ctx, `SELECT id, booking_id, user_id, request_type, details, status, created_at, updated_at
		FROM guest_service_requests WHERE booking_id = $1 AND user_id = $2 ORDER BY created_at DESC`, bookingID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	requests := make([]*models.GuestServiceRequest, 0)
	for rows.Next() {
		item := &models.GuestServiceRequest{}
		if err := rows.Scan(&item.ID, &item.BookingID, &item.UserID, &item.RequestType, &item.Details, &item.Status, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		requests = append(requests, item)
	}
	return requests, rows.Err()
}

func (r *BookingRepository) ListAllGuestServiceRequests(ctx context.Context, hotelID string) ([]*models.GuestServiceRequest, error) {
	rows, err := r.db.Query(ctx, `SELECT sr.id, sr.booking_id, sr.user_id, sr.request_type, sr.details, sr.status, sr.created_at, sr.updated_at,
		b.hotel_id, b.hotel_name, b.booking_code, concat_ws(' ', b.guest_first_name, b.guest_last_name), b.guest_email, b.check_in_date, b.check_out_date
		FROM guest_service_requests sr JOIN bookings b ON b.id = sr.booking_id
		WHERE ($1 = '' OR b.hotel_id = $1) ORDER BY sr.created_at DESC`, hotelID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	requests := make([]*models.GuestServiceRequest, 0)
	for rows.Next() {
		item := &models.GuestServiceRequest{}
		if err := rows.Scan(&item.ID, &item.BookingID, &item.UserID, &item.RequestType, &item.Details, &item.Status, &item.CreatedAt, &item.UpdatedAt,
			&item.HotelID, &item.HotelName, &item.BookingCode, &item.GuestName, &item.GuestEmail, &item.CheckIn, &item.CheckOut); err != nil {
			return nil, err
		}
		requests = append(requests, item)
	}
	return requests, rows.Err()
}

func (r *BookingRepository) UpdateGuestServiceRequestStatus(ctx context.Context, id uuid.UUID, status, hotelID string) (*models.GuestServiceRequest, error) {
	item := &models.GuestServiceRequest{}
	err := r.db.QueryRow(ctx, `UPDATE guest_service_requests sr SET status = $2, updated_at = NOW()
		FROM bookings b WHERE sr.id = $1 AND b.id = sr.booking_id AND ($3 = '' OR b.hotel_id = $3)
		RETURNING sr.id, sr.booking_id, sr.user_id, sr.request_type, sr.details, sr.status, sr.created_at, sr.updated_at`, id, status, hotelID).
		Scan(&item.ID, &item.BookingID, &item.UserID, &item.RequestType, &item.Details, &item.Status, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return item, nil
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

// ConfirmPendingBooking atomically confirms a live hold. A payment that arrives
// after the ten-minute hold expired cannot reclaim inventory already released.
func (r *BookingRepository) ConfirmPendingBooking(ctx context.Context, id uuid.UUID) (bool, error) {
	tag, err := r.db.Exec(ctx, `UPDATE bookings SET status = 'CONFIRMED', updated_at = NOW()
		WHERE id = $1 AND status = 'PENDING_PAYMENT' AND expires_at > NOW()`, id)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() == 1, nil
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
		SELECT COALESCE(MAX(booked), 0)
		FROM (
		  SELECT day::date,
		         COALESCE(SUM(b.room_count), 0)::int AS booked
		  FROM generate_series($2::date, $3::date - 1, interval '1 day') AS dates(day)
		  LEFT JOIN bookings b
		    ON b.room_type_id = $1
		   AND b.check_in_date <= day::date
		   AND b.check_out_date > day::date
		   AND (b.status IN ('CONFIRMED','CHECKED_IN') OR
		        (b.status = 'PENDING_PAYMENT' AND b.expires_at > NOW()))
		  GROUP BY day::date
		) nightly_inventory`

	var count int
	var err error
	if tx != nil {
		err = tx.QueryRow(ctx, q, roomTypeID, checkIn, checkOut).Scan(&count)
	} else {
		err = r.db.QueryRow(ctx, q, roomTypeID, checkIn, checkOut).Scan(&count)
	}
	return count, err
}

func (r *BookingRepository) GetOverlappingCountExcluding(ctx context.Context, tx pgx.Tx, roomTypeID string, checkIn, checkOut time.Time, excludeID uuid.UUID) (int, error) {
	const q = `SELECT COALESCE(MAX(booked), 0) FROM (
		SELECT day::date, COALESCE(SUM(b.room_count), 0)::int AS booked
		FROM generate_series($2::date, $3::date - 1, interval '1 day') AS dates(day)
		LEFT JOIN bookings b ON b.room_type_id = $1 AND b.id <> $4
		AND b.check_in_date <= day::date AND b.check_out_date > day::date
		AND (b.status IN ('CONFIRMED','CHECKED_IN') OR (b.status = 'PENDING_PAYMENT' AND b.expires_at > NOW()))
		GROUP BY day::date) nightly_inventory`
	var count int
	if err := tx.QueryRow(ctx, q, roomTypeID, checkIn, checkOut, excludeID).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

func (r *BookingRepository) UpdateGuestBooking(ctx context.Context, booking *models.Booking, userID uuid.UUID, isStaff bool, inventory int) error {
	tx, err := r.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if err := r.LockRoomType(ctx, tx, booking.RoomTypeID); err != nil {
		return err
	}
	overlap, err := r.GetOverlappingCountExcluding(ctx, tx, booking.RoomTypeID, booking.CheckInDate, booking.CheckOutDate, booking.ID)
	if err != nil {
		return err
	}
	if inventory-overlap < booking.RoomCount {
		return ErrNoRoomsLeft
	}
	var command pgconn.CommandTag
	if isStaff {
		command, err = tx.Exec(ctx, `UPDATE bookings SET check_in_date=$1, check_out_date=$2, total_nights=$3, guests_count=$4, room_count=$5,
			guest_first_name=$6, guest_last_name=$7, guest_phone=$8, special_requests=$9,
			room_price_per_night=$10, taxes_and_fees=$11, total_price=$12, updated_at=NOW()
			WHERE id=$13 AND status IN ('CONFIRMED','CHECKED_IN')`, booking.CheckInDate, booking.CheckOutDate, booking.TotalNights,
			booking.GuestsCount, booking.RoomCount, booking.GuestFirstName, booking.GuestLastName, booking.GuestPhone,
			booking.SpecialRequests, booking.RoomPricePerNight, booking.TaxesAndFees, booking.TotalPrice, booking.ID)
	} else {
		command, err = tx.Exec(ctx, `UPDATE bookings SET check_in_date=$1, check_out_date=$2, total_nights=$3, guests_count=$4, room_count=$5,
			guest_first_name=$6, guest_last_name=$7, guest_phone=$8, special_requests=$9,
			room_price_per_night=$10, taxes_and_fees=$11, total_price=$12, updated_at=NOW()
			WHERE id=$13 AND user_id=$14 AND status IN ('CONFIRMED','CHECKED_IN')`, booking.CheckInDate, booking.CheckOutDate, booking.TotalNights,
			booking.GuestsCount, booking.RoomCount, booking.GuestFirstName, booking.GuestLastName, booking.GuestPhone,
			booking.SpecialRequests, booking.RoomPricePerNight, booking.TaxesAndFees, booking.TotalPrice, booking.ID, userID)
	}
	if err != nil {
		return err
	}
	if command.RowsAffected() == 0 {
		return ErrBookingNotFound
	}
	return tx.Commit(ctx)
}

func (r *BookingRepository) CancelBooking(ctx context.Context, id uuid.UUID, userID *uuid.UUID, hotelID string) (*models.Booking, error) {
	whereOwner := userID != nil
	query := `UPDATE bookings SET status='CANCELLED', updated_at=NOW() WHERE id=$1
		AND status IN ('PENDING_PAYMENT','CONFIRMED') AND ($2::uuid IS NULL OR user_id=$2)
		AND ($3='' OR hotel_id=$3) RETURNING ` + bookingColumns
	if whereOwner {
		return scanBooking(r.db.QueryRow(ctx, query, id, *userID, hotelID))
	}
	return scanBooking(r.db.QueryRow(ctx, query, id, nil, hotelID))
}

func (r *BookingRepository) CreateGuestNotification(ctx context.Context, userID uuid.UUID, bookingID *uuid.UUID, eventType, title, message string) error {
	_, err := r.db.Exec(ctx, `INSERT INTO guest_notifications (id,user_id,booking_id,event_type,title,message) VALUES ($1,$2,$3,$4,$5,$6)`, uuid.New(), userID, bookingID, eventType, title, message)
	return err
}

func (r *BookingRepository) ListGuestNotifications(ctx context.Context, userID uuid.UUID) ([]*models.GuestNotification, error) {
	rows, err := r.db.Query(ctx, `SELECT id,booking_id,event_type,title,message,created_at,read_at FROM guest_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]*models.GuestNotification, 0)
	for rows.Next() {
		item := &models.GuestNotification{}
		if err := rows.Scan(&item.ID, &item.BookingID, &item.EventType, &item.Title, &item.Message, &item.CreatedAt, &item.ReadAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *BookingRepository) MarkGuestNotificationRead(ctx context.Context, id, userID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `UPDATE guest_notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=$1 AND user_id=$2`, id, userID)
	return err
}

// LockRoomType serializes inventory decisions for a room type across every
// date range. The lock is released automatically when the transaction ends.
func (r *BookingRepository) LockRoomType(ctx context.Context, tx pgx.Tx, roomTypeID string) error {
	_, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, roomTypeID)
	return err
}

func (r *BookingRepository) LockBookingCodePrefix(ctx context.Context, tx pgx.Tx, prefix string) error {
	_, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, "booking-code:"+prefix)
	return err
}

func (r *BookingRepository) ExpireStaleBookingsForRoomType(ctx context.Context, tx pgx.Tx, roomTypeID string) error {
	_, err := tx.Exec(ctx, `UPDATE bookings SET status = 'EXPIRED', updated_at = NOW()
		WHERE room_type_id = $1 AND status = 'PENDING_PAYMENT' AND expires_at <= NOW()`, roomTypeID)
	return err
}

// AvailabilityDay contains the number of room units reserved on a calendar date.
type AvailabilityDay struct {
	Date            time.Time
	BookedInventory int
}

// GetAvailabilityCalendar returns one row per date, with checkout dates treated
// as available because the stay interval is [check-in, check-out).
func (r *BookingRepository) GetAvailabilityCalendar(ctx context.Context, roomTypeID string, start, end time.Time) ([]AvailabilityDay, error) {
	const q = `
		SELECT day::date,
		       COALESCE(SUM(b.room_count), 0)::int AS booked_inventory
		FROM generate_series($2::date, $3::date, interval '1 day') AS dates(day)
		LEFT JOIN bookings b
		  ON b.room_type_id = $1
		 AND b.check_in_date <= day::date
		 AND b.check_out_date > day::date
		 AND (b.status IN ('CONFIRMED','CHECKED_IN') OR
		      (b.status = 'PENDING_PAYMENT' AND b.expires_at > NOW()))
		GROUP BY day::date
		ORDER BY day::date`
	rows, err := r.db.Query(ctx, q, roomTypeID, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	days := make([]AvailabilityDay, 0)
	for rows.Next() {
		var day AvailabilityDay
		if err := rows.Scan(&day.Date, &day.BookedInventory); err != nil {
			return nil, err
		}
		days = append(days, day)
	}
	return days, rows.Err()
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
	return r.db.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.ReadCommitted})
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
