-- ============================================================
-- Employee & Operations Service Schema (hotel_operations_db)
-- Database: PostgreSQL 16
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    department_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    position VARCHAR(64) NOT NULL,
    joining_date DATE NOT NULL,
    salary DOUBLE PRECISION,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department_id VARCHAR(64) NOT NULL,
    assignee_id UUID REFERENCES employees(id),
    priority VARCHAR(16) NOT NULL DEFAULT 'MEDIUM', -- LOW | MEDIUM | HIGH | URGENT
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',  -- PENDING | IN_PROGRESS | COMPLETED | CANCELLED
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift_start VARCHAR(8) NOT NULL,
    shift_end VARCHAR(8) NOT NULL,
    shift_type VARCHAR(16) NOT NULL, -- MORNING | AFTERNOON | NIGHT
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees (department_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_dept ON tasks (department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_schedules_emp_date ON schedules (employee_id, date);

