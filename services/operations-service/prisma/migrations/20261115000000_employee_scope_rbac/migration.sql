ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "employee_code" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "hotel_id" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "role" VARCHAR(64) DEFAULT 'STAFF',
  ADD COLUMN IF NOT EXISTS "permissions" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "employees_employee_code_key"
  ON "employees"("employee_code");

CREATE INDEX IF NOT EXISTS "idx_employees_hotel"
  ON "employees"("hotel_id");
