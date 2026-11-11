-- ============================================================
-- User / Guest Service Schema (hotel_users_db)
-- Database: PostgreSQL 16
-- ============================================================

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

