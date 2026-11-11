package config

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// InitDB creates, validates, and initializes the bookings table schema.
func InitDB(databaseURL string) (*pgxpool.Pool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := NewPool(ctx, databaseURL)
	if err != nil {
		return nil, err
	}

	// Try reading schema from sql/schema.sql
	var schema string
	if data, err := os.ReadFile("sql/schema.sql"); err == nil {
		schema = string(data)
	} else {
		schema = `
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
		`
	}
	_, _ = pool.Exec(ctx, schema)

	return pool, nil
}

// NewPool creates and validates a pgxpool connection pool.
// Pool settings: MaxConns=25, MinConns=5, MaxConnLifetime=1h, MaxConnIdleTime=30m.
func NewPool(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	poolCfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse database URL: %w", err)
	}

	poolCfg.MaxConns = 25
	poolCfg.MinConns = 5
	poolCfg.MaxConnLifetime = time.Hour
	poolCfg.MaxConnIdleTime = 30 * time.Minute
	poolCfg.HealthCheckPeriod = time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	// Verify connectivity immediately.
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	return pool, nil
}
