-- Seed Admin User for StayEase
-- Email: mala@gmail.com
-- Password: 123456
-- Role: ADMIN

\connect hotel_auth_db;

INSERT INTO users (id, email, password_hash, name, phone, role, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'mala@gmail.com',
    '$2a$10$1K3tQfukdwHoKR2JUD2GoedlpuRtK8Y0Hx4.abW21IsxUUSO.jVf2',
    'Mala Admin',
    '+91 9876543210',
    'ADMIN',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = 'ADMIN',
    is_active = true,
    updated_at = NOW();

