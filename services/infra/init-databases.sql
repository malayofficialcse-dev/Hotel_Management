-- ============================================================
-- Enterprise Hotel Management System - PostgreSQL Initialization
-- Initializes all 7 production databases, extensions, and tables
-- ============================================================

-- 1. Create all service databases idempotently
SELECT 'CREATE DATABASE hotel_auth_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hotel_auth_db')\gexec

SELECT 'CREATE DATABASE hotel_users_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hotel_users_db')\gexec

SELECT 'CREATE DATABASE hotel_bookings_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hotel_bookings_db')\gexec

SELECT 'CREATE DATABASE hotel_payments_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hotel_payments_db')\gexec

SELECT 'CREATE DATABASE hotel_operations_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hotel_operations_db')\gexec

SELECT 'CREATE DATABASE hotel_notifications_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hotel_notifications_db')\gexec

SELECT 'CREATE DATABASE hotel_analytics_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hotel_analytics_db')\gexec

-- ============================================================
-- 1. hotel_auth_db (Auth Service)
-- ============================================================
\connect hotel_auth_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(128) NOT NULL,
    phone VARCHAR(32),
    role VARCHAR(32) NOT NULL DEFAULT 'CUSTOMER',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);

-- ============================================================
-- 2. hotel_users_db (User & Guest Management Service)
-- ============================================================
\connect hotel_users_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    phone VARCHAR(32),
    avatar_url TEXT,
    city VARCHAR(64),
    country VARCHAR(64) DEFAULT 'India',
    id_proof VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    hotel_id VARCHAR(64) NOT NULL,
    hotel_name VARCHAR(128) NOT NULL,
    hotel_city VARCHAR(64) NOT NULL,
    image TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_wishlist_user_hotel UNIQUE (user_id, hotel_id)
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    preferred_city VARCHAR(64),
    preferred_category VARCHAR(64) DEFAULT 'All',
    newsletter_opt_in BOOLEAN NOT NULL DEFAULT true,
    sms_alerts BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (email);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items (user_id);

-- ============================================================
-- 3. hotel_bookings_db (Go Booking Engine)
-- ============================================================
\connect hotel_bookings_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE INDEX IF NOT EXISTS idx_bookings_availability ON bookings (room_type_id, status, check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings (booking_code);

-- ============================================================
-- 4. hotel_payments_db (Payment Service)
-- ============================================================
\connect hotel_payments_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE,
    booking_code VARCHAR(32) NOT NULL,
    user_id UUID,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    provider VARCHAR(32) NOT NULL DEFAULT 'STRIPE',
    stripe_intent_id VARCHAR(128) UNIQUE,
    payment_method VARCHAR(64),
    receipt_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT,
    stripe_refund_id VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);

-- ============================================================
-- 5. hotel_operations_db (Employee & Operations Service)
-- ============================================================
\connect hotel_operations_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,
    hotel_id VARCHAR(64) NOT NULL,
    description TEXT,
    head_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES departments(id),
    name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    position VARCHAR(64) NOT NULL,
    joining_date DATE NOT NULL,
    salary NUMERIC(10, 2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department_id UUID NOT NULL REFERENCES departments(id),
    assignee_id UUID REFERENCES employees(id),
    priority VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift_start VARCHAR(8) NOT NULL,
    shift_end VARCHAR(8) NOT NULL,
    shift_type VARCHAR(16) NOT NULL,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees (department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_dept ON tasks (department_id);

-- ============================================================
-- 6. hotel_notifications_db (Notification Service)
-- ============================================================
\connect hotel_notifications_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    channel VARCHAR(32) NOT NULL,
    template VARCHAR(64) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SENT',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notification_logs (recipient);

-- ============================================================
-- 7. hotel_analytics_db (Analytics Service)
-- ============================================================
\connect hotel_analytics_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS daily_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL UNIQUE,
    total_bookings INT NOT NULL DEFAULT 0,
    total_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    average_daily_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    revenue_per_available_room NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hotel_occupancy_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id VARCHAR(64) NOT NULL,
    hotel_name VARCHAR(128) NOT NULL,
    snapshot_date DATE NOT NULL,
    total_rooms INT NOT NULL,
    occupied_rooms INT NOT NULL,
    occupancy_rate NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_occupancy_hotel_date UNIQUE (hotel_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_revenue_date ON daily_revenue (report_date);
