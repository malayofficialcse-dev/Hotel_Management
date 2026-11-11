-- ============================================================
-- Analytics Service Schema (hotel_analytics_db)
-- Database: PostgreSQL 16
-- ============================================================

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
CREATE INDEX IF NOT EXISTS idx_occupancy_snapshot ON hotel_occupancy_snapshots (hotel_id, snapshot_date);

