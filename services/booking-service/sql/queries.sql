-- ============================================================
-- Booking Service Queries (sqlc / pgx compatible)
-- ============================================================

-- name: CreateBooking :exec
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
);

-- name: GetBookingByID :one
SELECT 
    id, booking_code, user_id,
    hotel_id, hotel_name, room_type_id, room_type_name,
    check_in_date, check_out_date, total_nights,
    guests_count, room_count,
    room_price_per_night, taxes_and_fees, total_price,
    status,
    guest_first_name, guest_last_name, guest_email, guest_phone,
    special_requests, expires_at, created_at, updated_at
FROM bookings 
WHERE id = $1;

-- name: GetBookingByCode :one
SELECT 
    id, booking_code, user_id,
    hotel_id, hotel_name, room_type_id, room_type_name,
    check_in_date, check_out_date, total_nights,
    guests_count, room_count,
    room_price_per_night, taxes_and_fees, total_price,
    status,
    guest_first_name, guest_last_name, guest_email, guest_phone,
    special_requests, expires_at, created_at, updated_at
FROM bookings 
WHERE booking_code = $1;

-- name: GetBookingsByUser :many
SELECT 
    id, booking_code, user_id,
    hotel_id, hotel_name, room_type_id, room_type_name,
    check_in_date, check_out_date, total_nights,
    guests_count, room_count,
    room_price_per_night, taxes_and_fees, total_price,
    status,
    guest_first_name, guest_last_name, guest_email, guest_phone,
    special_requests, expires_at, created_at, updated_at
FROM bookings 
WHERE user_id = $1 
ORDER BY created_at DESC;

-- name: GetBookingsByHotel :many
SELECT 
    id, booking_code, user_id,
    hotel_id, hotel_name, room_type_id, room_type_name,
    check_in_date, check_out_date, total_nights,
    guests_count, room_count,
    room_price_per_night, taxes_and_fees, total_price,
    status,
    guest_first_name, guest_last_name, guest_email, guest_phone,
    special_requests, expires_at, created_at, updated_at
FROM bookings 
WHERE hotel_id = $1 
ORDER BY check_in_date ASC;

-- name: UpdateStatus :exec
UPDATE bookings 
SET status = $1, updated_at = $2 
WHERE id = $3;

-- name: GetOverlappingCount :one
SELECT COALESCE(SUM(room_count), 0)
FROM   bookings
WHERE  room_type_id = $1
  AND  status IN ('PENDING_PAYMENT','CONFIRMED','CHECKED_IN')
  AND  check_in_date  < $3
  AND  check_out_date > $2;

-- name: ExpireStaleBookings :execrows
UPDATE bookings
SET    status     = 'EXPIRED',
       updated_at = NOW()
WHERE  status    = 'PENDING_PAYMENT'
  AND  expires_at < NOW();

