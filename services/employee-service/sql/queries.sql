-- ============================================================
-- Employee & Operations Service SQL Queries
-- ============================================================

-- name: ListEmployees :many
SELECT e.id, e.user_id, e.department_id, e.name, e.email, e.phone, e.position,
       e.joining_date, e.salary, e.is_active, e.created_at, e.updated_at
FROM employees e
WHERE ($1::text IS NULL OR e.department_id = $1)
  AND ($2::boolean IS NULL OR e.is_active = $2)
ORDER BY e.created_at DESC;

-- name: GetEmployeeByID :one
SELECT e.id, e.user_id, e.department_id, e.name, e.email, e.phone, e.position,
       e.joining_date, e.salary, e.is_active, e.created_at, e.updated_at
FROM employees e
WHERE e.id = $1;

-- name: CreateEmployee :one
INSERT INTO employees (
    id, user_id, department_id, name, email, phone, position, joining_date, salary, is_active, created_at, updated_at
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW()
)
RETURNING *;

-- name: ListTasks :many
SELECT t.id, t.title, t.description, t.department_id, t.assignee_id,
       t.priority, t.status, t.due_date, t.completed_at, t.created_at, t.updated_at,
       e.name as assignee_name
FROM tasks t
LEFT JOIN employees e ON t.assignee_id = e.id
WHERE ($1::text IS NULL OR t.department_id = $1)
  AND ($2::uuid IS NULL OR t.assignee_id = $2)
ORDER BY t.created_at DESC;

-- name: UpdateTaskStatus :one
UPDATE tasks
SET status = $2,
    completed_at = CASE WHEN $2 = 'COMPLETED' THEN NOW() ELSE completed_at END,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: GetSchedulesByEmployee :many
SELECT id, employee_id, date, shift_start, shift_end, shift_type, notes
FROM schedules
WHERE employee_id = $1
  AND date >= CURRENT_DATE
ORDER BY date ASC;

