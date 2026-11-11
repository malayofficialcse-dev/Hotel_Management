-- ============================================================
-- Payment Service SQL Queries
-- ============================================================

-- name: CreatePayment :one
INSERT INTO payments (
    id, booking_id, booking_code, user_id, amount, currency, status, provider, created_at, updated_at
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, COALESCE($5, 'INR'), 'PENDING', COALESCE($6, 'STRIPE'), NOW(), NOW()
)
RETURNING *;

-- name: UpdatePaymentStatus :one
UPDATE payments
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: GetPaymentByBookingID :one
SELECT id, booking_id, booking_code, user_id, amount, currency, status, provider, receipt_url, created_at, updated_at
FROM payments
WHERE booking_id = $1;

-- name: GetPaymentByID :one
SELECT id, booking_id, booking_code, user_id, amount, currency, status, provider, receipt_url, created_at, updated_at
FROM payments
WHERE id = $1;

-- name: CreateRefund :one
INSERT INTO refunds (
    id, payment_id, amount, reason, status, created_at
) VALUES (
    gen_random_uuid(), $1, $2, $3, 'COMPLETED', NOW()
)
RETURNING *;

-- name: GetRefundsByPaymentID :many
SELECT id, payment_id, amount, reason, stripe_refund_id, status, created_at
FROM refunds
WHERE payment_id = $1
ORDER BY created_at DESC;

