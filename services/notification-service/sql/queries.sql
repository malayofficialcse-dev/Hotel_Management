-- ============================================================
-- Notification Service SQL Queries
-- ============================================================

-- name: CreateNotificationLog :one
INSERT INTO notification_logs (
    id, recipient, channel, template, subject, body, status, sent_at
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5, COALESCE($6, 'SENT'), NOW()
)
RETURNING *;

-- name: ListRecentNotifications :many
SELECT id, recipient, channel, template, subject, body, status, sent_at
FROM notification_logs
ORDER BY sent_at DESC
LIMIT 50;

-- name: ListNotificationsByRecipient :many
SELECT id, recipient, channel, template, subject, body, status, sent_at
FROM notification_logs
WHERE recipient = $1
ORDER BY sent_at DESC;

