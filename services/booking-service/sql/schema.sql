-- ============================================================
-- Booking Service Schema (hotel_bookings_db)
-- Database: PostgreSQL 16
-- ============================================================

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY,
    booking_code VARCHAR(32) NOT NULL UNIQUE,
    user_id UUID,
    hotel_id VARCHAR(64) NOT NULL,
    hotel_name VARCHAR(128) NOT NULL,
    room_type_id VARCHAR(64) NOT NULL,
    room_type_name VARCHAR(128) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_nights INT NOT NULL,
    guests_count INT NOT NULL,
    room_count INT NOT NULL,
    room_price_per_night NUMERIC(10, 2) NOT NULL,
    taxes_and_fees NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(32) NOT NULL,
    guest_first_name VARCHAR(64) NOT NULL,
    guest_last_name VARCHAR(64) NOT NULL,
    guest_email VARCHAR(128) NOT NULL,
    guest_phone VARCHAR(32) NOT NULL,
    special_requests TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compound index for fast overlapping availability queries during cart hold
CREATE INDEX IF NOT EXISTS idx_bookings_availability ON bookings (room_type_id, status, check_in_date, check_out_date);

-- Index for customer dashboard retrieval
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id);

-- Index for booking code lookup
CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings (booking_code);

-- Index for expired holds cron cleanup
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at ON bookings (status, expires_at);

