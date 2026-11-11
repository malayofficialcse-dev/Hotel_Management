-- ============================================================
-- User / Guest Service SQL Queries
-- ============================================================

-- name: GetUserProfileByID :one
SELECT id, email, name, phone, avatar_url, city, country, id_proof, created_at, updated_at
FROM user_profiles
WHERE id = $1;

-- name: GetUserProfileByEmail :one
SELECT id, email, name, phone, avatar_url, city, country, id_proof, created_at, updated_at
FROM user_profiles
WHERE email = $1;

-- name: UpsertUserProfile :one
INSERT INTO user_profiles (
    id, email, name, phone, avatar_url, city, country, id_proof, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, COALESCE($7, 'India'), $8, NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    city = COALESCE(EXCLUDED.city, user_profiles.city),
    country = COALESCE(EXCLUDED.country, user_profiles.country),
    id_proof = COALESCE(EXCLUDED.id_proof, user_profiles.id_proof),
    updated_at = NOW()
RETURNING *;

-- name: GetWishlistByUser :many
SELECT id, user_id, hotel_id, hotel_name, hotel_city, image, price, added_at
FROM wishlist_items
WHERE user_id = $1
ORDER BY added_at DESC;

-- name: AddToWishlist :one
INSERT INTO wishlist_items (
    id, user_id, hotel_id, hotel_name, hotel_city, image, price, added_at
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
)
ON CONFLICT (user_id, hotel_id) DO UPDATE SET
    price = EXCLUDED.price
RETURNING *;

-- name: RemoveFromWishlist :exec
DELETE FROM wishlist_items
WHERE user_id = $1 AND hotel_id = $2;

-- name: GetUserPreferences :one
SELECT id, user_id, preferred_city, preferred_category, newsletter_opt_in, sms_alerts, updated_at
FROM user_preferences
WHERE user_id = $1;

-- name: UpsertUserPreferences :one
INSERT INTO user_preferences (
    id, user_id, preferred_city, preferred_category, newsletter_opt_in, sms_alerts, updated_at
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5, NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    preferred_city = EXCLUDED.preferred_city,
    preferred_category = EXCLUDED.preferred_category,
    newsletter_opt_in = EXCLUDED.newsletter_opt_in,
    sms_alerts = EXCLUDED.sms_alerts,
    updated_at = NOW()
RETURNING *;

