-- ============================================================
-- Authentication Service SQL Queries
-- ============================================================

-- name: FindUserByEmail :one
SELECT id, email, password_hash, name, phone, role, is_active, created_at, updated_at
FROM users
WHERE email = $1;

-- name: FindUserByID :one
SELECT id, email, name, phone, role, is_active, created_at, updated_at
FROM users
WHERE id = $1;

-- name: CreateUser :one
INSERT INTO users (
    id, email, password_hash, name, phone, role, is_active, created_at, updated_at
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, COALESCE($5, 'CUSTOMER'), true, NOW(), NOW()
)
RETURNING id, email, name, phone, role, created_at;

-- name: SaveRefreshToken :one
INSERT INTO refresh_tokens (
    id, user_id, token_hash, expires_at, created_at
) VALUES (
    gen_random_uuid(), $1, $2, $3, NOW()
)
RETURNING id, user_id, token_hash, expires_at, created_at;

-- name: FindRefreshToken :one
SELECT rt.id, rt.user_id, rt.token_hash, rt.expires_at, rt.created_at,
       u.id as user_id, u.email as user_email, u.name as user_name, u.role as user_role
FROM refresh_tokens rt
JOIN users u ON rt.user_id = u.id
WHERE rt.token_hash = $1;

-- name: DeleteRefreshToken :exec
DELETE FROM refresh_tokens
WHERE token_hash = $1;

-- name: DeleteExpiredRefreshTokens :execrows
DELETE FROM refresh_tokens
WHERE expires_at < NOW();

