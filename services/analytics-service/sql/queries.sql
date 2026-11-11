-- ============================================================
-- Analytics Service SQL Queries
-- ============================================================

-- name: GetLatestOverview :one
SELECT 
    COALESCE(SUM(total_bookings), 0)::int as total_bookings,
    COALESCE(SUM(total_revenue), 0.00)::numeric as total_revenue,
    COALESCE(AVG(average_daily_rate), 0.00)::numeric as average_daily_rate,
    COALESCE(AVG(revenue_per_available_room), 0.00)::numeric as revenue_per_room
FROM daily_revenue
WHERE report_date >= CURRENT_DATE - INTERVAL '30 days';

-- name: UpsertDailyRevenue :one
INSERT INTO daily_revenue (
    id, report_date, total_bookings, total_revenue, average_daily_rate, revenue_per_available_room, updated_at
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5, NOW()
)
ON CONFLICT (report_date) DO UPDATE SET
    total_bookings = daily_revenue.total_bookings + EXCLUDED.total_bookings,
    total_revenue = daily_revenue.total_revenue + EXCLUDED.total_revenue,
    average_daily_rate = EXCLUDED.average_daily_rate,
    revenue_per_available_room = EXCLUDED.revenue_per_available_room,
    updated_at = NOW()
RETURNING *;

-- name: GetMonthlyRevenueBreakdown :many
SELECT 
    TO_CHAR(report_date, 'Mon') as month,
    SUM(total_revenue) as revenue
FROM daily_revenue
WHERE report_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY TO_CHAR(report_date, 'Mon'), DATE_TRUNC('month', report_date)
ORDER BY DATE_TRUNC('month', report_date) ASC;

-- name: RecordHotelOccupancy :one
INSERT INTO hotel_occupancy_snapshots (
    id, hotel_id, hotel_name, snapshot_date, total_rooms, occupied_rooms, occupancy_rate, created_at
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
)
ON CONFLICT (hotel_id, snapshot_date) DO UPDATE SET
    total_rooms = EXCLUDED.total_rooms,
    occupied_rooms = EXCLUDED.occupied_rooms,
    occupancy_rate = EXCLUDED.occupancy_rate
RETURNING *;

-- name: GetLatestHotelOccupancy :many
SELECT DISTINCT ON (hotel_id)
    hotel_id, hotel_name, snapshot_date, total_rooms, occupied_rooms, occupancy_rate
FROM hotel_occupancy_snapshots
ORDER BY hotel_id, snapshot_date DESC;

