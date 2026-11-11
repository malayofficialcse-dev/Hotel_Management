-- ============================================================
-- Notification Service Schema (hotel_notifications_db)
-- Database: PostgreSQL 16
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    channel VARCHAR(32) NOT NULL, -- EMAIL | SMS | WHATSAPP | PUSH
    template VARCHAR(64) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SENT', -- SENT | FAILED | DELIVERED
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notification_logs (recipient);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notification_logs (channel);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notification_logs (sent_at);

