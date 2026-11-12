CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "employees" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "department_id" TEXT NOT NULL,
  "name" VARCHAR(128) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(32),
  "position" VARCHAR(64) NOT NULL,
  "joining_date" DATE NOT NULL,
  "salary" DOUBLE PRECISION,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'userId') THEN
    ALTER TABLE "employees" RENAME COLUMN "userId" TO "user_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'departmentId') THEN
    ALTER TABLE "employees" RENAME COLUMN "departmentId" TO "department_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'joiningDate') THEN
    ALTER TABLE "employees" RENAME COLUMN "joiningDate" TO "joining_date";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'isActive') THEN
    ALTER TABLE "employees" RENAME COLUMN "isActive" TO "is_active";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'createdAt') THEN
    ALTER TABLE "employees" RENAME COLUMN "createdAt" TO "created_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'updatedAt') THEN
    ALTER TABLE "employees" RENAME COLUMN "updatedAt" TO "updated_at";
  END IF;
END $$;

ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_department_id_fkey";
ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_departmentId_fkey";
DO $$
BEGIN
  IF to_regclass('tasks') IS NOT NULL THEN
    ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_assignee_id_fkey";
    ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_assigneeId_fkey";
  END IF;
  IF to_regclass('schedules') IS NOT NULL THEN
    ALTER TABLE "schedules" DROP CONSTRAINT IF EXISTS "schedules_employee_id_fkey";
    ALTER TABLE "schedules" DROP CONSTRAINT IF EXISTS "schedules_employeeId_fkey";
  END IF;
END $$;
ALTER TABLE "employees" ALTER COLUMN "department_id" TYPE TEXT USING "department_id"::TEXT;
ALTER TABLE "employees" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "employees" ALTER COLUMN "user_id" TYPE UUID USING "user_id"::UUID;
ALTER TABLE "employees" ALTER COLUMN "salary" TYPE DOUBLE PRECISION USING "salary"::DOUBLE PRECISION;
ALTER TABLE "employees" ALTER COLUMN "joining_date" TYPE DATE USING "joining_date"::DATE;
SET TIME ZONE 'UTC';
ALTER TABLE "employees" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(6) USING "created_at"::TIMESTAMPTZ;
ALTER TABLE "employees" ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(6) USING "updated_at"::TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS "employees_user_id_key" ON "employees"("user_id");
CREATE INDEX IF NOT EXISTS "idx_employees_dept" ON "employees"("department_id");

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "department_id" TEXT NOT NULL,
  "assignee_id" UUID,
  "priority" VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
  "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  "due_date" TIMESTAMPTZ(6),
  "completed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'departmentId') THEN
    ALTER TABLE "tasks" RENAME COLUMN "departmentId" TO "department_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigneeId') THEN
    ALTER TABLE "tasks" RENAME COLUMN "assigneeId" TO "assignee_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'dueDate') THEN
    ALTER TABLE "tasks" RENAME COLUMN "dueDate" TO "due_date";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'completedAt') THEN
    ALTER TABLE "tasks" RENAME COLUMN "completedAt" TO "completed_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'createdAt') THEN
    ALTER TABLE "tasks" RENAME COLUMN "createdAt" TO "created_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'updatedAt') THEN
    ALTER TABLE "tasks" RENAME COLUMN "updatedAt" TO "updated_at";
  END IF;
END $$;

ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_department_id_fkey";
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_departmentId_fkey";
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_assignee_id_fkey";
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_assigneeId_fkey";
ALTER TABLE "tasks" ALTER COLUMN "department_id" TYPE TEXT USING "department_id"::TEXT;
ALTER TABLE "tasks" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "tasks" ALTER COLUMN "assignee_id" TYPE UUID USING NULLIF("assignee_id"::TEXT, '')::UUID;
ALTER TABLE "tasks" ALTER COLUMN "due_date" TYPE TIMESTAMPTZ(6) USING "due_date"::TIMESTAMPTZ;
ALTER TABLE "tasks" ALTER COLUMN "completed_at" TYPE TIMESTAMPTZ(6) USING "completed_at"::TIMESTAMPTZ;
ALTER TABLE "tasks" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(6) USING "created_at"::TIMESTAMPTZ;
ALTER TABLE "tasks" ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(6) USING "updated_at"::TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS "idx_tasks_dept" ON "tasks"("department_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_assignee" ON "tasks"("assignee_id");

CREATE TABLE IF NOT EXISTS "schedules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "shift_start" VARCHAR(8) NOT NULL,
  "shift_end" VARCHAR(8) NOT NULL,
  "shift_type" VARCHAR(16) NOT NULL,
  "notes" TEXT,
  CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'employeeId') THEN
    ALTER TABLE "schedules" RENAME COLUMN "employeeId" TO "employee_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'shiftStart') THEN
    ALTER TABLE "schedules" RENAME COLUMN "shiftStart" TO "shift_start";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'shiftEnd') THEN
    ALTER TABLE "schedules" RENAME COLUMN "shiftEnd" TO "shift_end";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'shiftType') THEN
    ALTER TABLE "schedules" RENAME COLUMN "shiftType" TO "shift_type";
  END IF;
END $$;

ALTER TABLE "schedules" DROP CONSTRAINT IF EXISTS "schedules_employee_id_fkey";
ALTER TABLE "schedules" DROP CONSTRAINT IF EXISTS "schedules_employeeId_fkey";
ALTER TABLE "schedules" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "schedules" ALTER COLUMN "employee_id" TYPE UUID USING "employee_id"::UUID;
CREATE INDEX IF NOT EXISTS "idx_schedules_emp_date" ON "schedules"("employee_id", "date");
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey"
  FOREIGN KEY ("assignee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
