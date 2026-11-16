-- ============================================================
-- StayEase Enterprise Hotel Management Platform
-- Master PostgreSQL Seed Script (for local PostgreSQL on 55432 / 5432)
-- Password for all seeded users: Password@123
-- Hash: $2a$10$bUCQ9DZwcFu86eiGfYkHA.yaHKpsulLsuOrYvTd0i5/KxstkhF2.W
-- ============================================================

-- ============================================================
-- 1. hotel_operations_db (Departments, Employees, Tasks, Schedules)
-- ============================================================
\connect hotel_operations_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure departments table exists
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,
    hotel_id VARCHAR(64) NOT NULL,
    description TEXT,
    head_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_departments_hotel ON departments (hotel_id);

-- Insert 7 core departments for each of the 7 hotels (49 departments total)
INSERT INTO departments (id, name, hotel_id, description, created_at, updated_at) VALUES
-- The Palm House (Goa)
('10000000-0000-0000-0001-000000000001', 'Management', 'palm-house', 'Resort executive leadership and operations oversight', NOW(), NOW()),
('10000000-0000-0000-0001-000000000002', 'Front Office', 'palm-house', 'Guest arrivals, concierge, reservations and guest relations', NOW(), NOW()),
('10000000-0000-0000-0001-000000000003', 'Housekeeping', 'palm-house', 'Villa cleaning, linen management and resort hygiene', NOW(), NOW()),
('10000000-0000-0000-0001-000000000004', 'Food & Beverage', 'palm-house', 'Beachside restaurant, pool bar and room service dining', NOW(), NOW()),
('10000000-0000-0000-0001-000000000005', 'Maintenance', 'palm-house', 'Facility engineering, pool filtration and HVAC systems', NOW(), NOW()),
('10000000-0000-0000-0001-000000000006', 'Security', 'palm-house', '24/7 guest safety, CCTV surveillance and perimeter patrol', NOW(), NOW()),
('10000000-0000-0000-0001-000000000007', 'Human Resources', 'palm-house', 'Staff recruitment, hospitality training and payroll', NOW(), NOW()),

-- Haveli & Co. (Jaipur)
('20000000-0000-0000-0002-000000000001', 'Management', 'haveli', 'Heritage property general management', NOW(), NOW()),
('20000000-0000-0000-0002-000000000002', 'Front Office', 'haveli', 'Royal reception, tour desk and guest welcome ceremonies', NOW(), NOW()),
('20000000-0000-0000-0002-000000000003', 'Housekeeping', 'haveli', 'Courtyard maintenance and antique preservation', NOW(), NOW()),
('20000000-0000-0000-0002-000000000004', 'Food & Beverage', 'haveli', 'Rooftop Rajasthani thali dining and courtyard cafe', NOW(), NOW()),
('20000000-0000-0000-0002-000000000005', 'Maintenance', 'haveli', 'Historic structure upkeep and electrical systems', NOW(), NOW()),
('20000000-0000-0000-0002-000000000006', 'Security', 'haveli', 'Heritage asset security and guest assistance', NOW(), NOW()),
('20000000-0000-0000-0002-000000000007', 'Human Resources', 'haveli', 'Cultural staff training and team welfare', NOW(), NOW()),

-- Lakehouse Retreat (Udaipur)
('30000000-0000-0000-0003-000000000001', 'Management', 'lakehouse', 'Lakeside retreat general management', NOW(), NOW()),
('30000000-0000-0000-0003-000000000002', 'Front Office', 'lakehouse', 'Jetty arrival reception, butler coordination', NOW(), NOW()),
('30000000-0000-0000-0003-000000000003', 'Housekeeping', 'lakehouse', 'Luxury lake suites cleaning and laundry', NOW(), NOW()),
('30000000-0000-0000-0003-000000000004', 'Food & Beverage', 'lakehouse', 'Lake Pichola fine dining and terrace lounge', NOW(), NOW()),
('30000000-0000-0000-0003-000000000005', 'Maintenance', 'lakehouse', 'Boat mechanics, infinity pool and estate utilities', NOW(), NOW()),
('30000000-0000-0000-0003-000000000006', 'Security', 'lakehouse', 'Lake perimeter security and VIP escort', NOW(), NOW()),
('30000000-0000-0000-0003-000000000007', 'Human Resources', 'lakehouse', 'Luxury hospitality talent management', NOW(), NOW()),

-- Monsoon Grove Retreat (Munnar)
('40000000-0000-0000-0004-000000000001', 'Management', 'monsoon-grove', 'Hill resort general operations', NOW(), NOW()),
('40000000-0000-0000-0004-000000000002', 'Front Office', 'monsoon-grove', 'Trek registrations and nature guide desk', NOW(), NOW()),
('40000000-0000-0000-0004-000000000003', 'Housekeeping', 'monsoon-grove', 'Cottage upkeep and fireplace wood management', NOW(), NOW()),
('40000000-0000-0000-0004-000000000004', 'Food & Beverage', 'monsoon-grove', 'Traditional Kerala cuisine and organic tea bar', NOW(), NOW()),
('40000000-0000-0000-0004-000000000005', 'Maintenance', 'monsoon-grove', 'Estate water supply and generators', NOW(), NOW()),
('40000000-0000-0000-0004-000000000006', 'Security', 'monsoon-grove', 'Tea garden patrol and boundary safety', NOW(), NOW()),
('40000000-0000-0000-0004-000000000007', 'Human Resources', 'monsoon-grove', 'Local community staffing and welfare', NOW(), NOW()),

-- Bluewater Cove Resort (Havelock Island)
('50000000-0000-0000-0005-000000000001', 'Management', 'bluewater-cove', 'Island resort leadership and logistics', NOW(), NOW()),
('50000000-0000-0000-0005-000000000002', 'Front Office', 'bluewater-cove', 'Ferry transfers and watersports booking desk', NOW(), NOW()),
('50000000-0000-0000-0005-000000000003', 'Housekeeping', 'bluewater-cove', 'Beach chalet sanitization and towel service', NOW(), NOW()),
('50000000-0000-0000-0005-000000000004', 'Food & Beverage', 'bluewater-cove', 'Fresh coastal seafood and beach shack cocktails', NOW(), NOW()),
('50000000-0000-0000-0005-000000000005', 'Maintenance', 'bluewater-cove', 'Desalination plant and solar microgrid', NOW(), NOW()),
('50000000-0000-0000-0005-000000000006', 'Security', 'bluewater-cove', 'Lifeguards and beachfront marine safety', NOW(), NOW()),
('50000000-0000-0000-0005-000000000007', 'Human Resources', 'bluewater-cove', 'Island hospitality crew logistics', NOW(), NOW()),

-- Amber Courtyard Palace (Jaisalmer)
('60000000-0000-0000-0006-000000000001', 'Management', 'amber-courtyard', 'Desert palace management and safari ops', NOW(), NOW()),
('60000000-0000-0000-0006-000000000002', 'Front Office', 'amber-courtyard', 'Desert safari concierge and check-in', NOW(), NOW()),
('60000000-0000-0000-0006-000000000003', 'Housekeeping', 'amber-courtyard', 'Sandstone room care and evening turndown', NOW(), NOW()),
('60000000-0000-0000-0006-000000000004', 'Food & Beverage', 'amber-courtyard', 'Royal Thar dinners and cultural feast', NOW(), NOW()),
('60000000-0000-0000-0006-000000000005', 'Maintenance', 'amber-courtyard', 'Desert climate control and solar boilers', NOW(), NOW()),
('60000000-0000-0000-0006-000000000006', 'Security', 'amber-courtyard', 'Fort safety and guest transport escort', NOW(), NOW()),
('60000000-0000-0000-0006-000000000007', 'Human Resources', 'amber-courtyard', 'Desert region artisan and staff support', NOW(), NOW()),

-- Harborlight House (Kochi)
('70000000-0000-0000-0007-000000000001', 'Management', 'harborlight-house', 'Boutique hotel management and art events', NOW(), NOW()),
('70000000-0000-0000-0007-000000000002', 'Front Office', 'harborlight-house', 'Heritage tours and city transit desk', NOW(), NOW()),
('70000000-0000-0000-0007-000000000003', 'Housekeeping', 'harborlight-house', 'Mansion care, antique restoration and laundry', NOW(), NOW()),
('70000000-0000-0000-0007-000000000004', 'Food & Beverage', 'harborlight-house', 'Harbor cafe, artisan coffee and bakery', NOW(), NOW()),
('70000000-0000-0000-0005-000000000005', 'Maintenance', 'harborlight-house', 'Historic preservation and electrical upkeep', NOW(), NOW()),
('70000000-0000-0000-0007-000000000006', 'Security', 'harborlight-house', 'Property safety and harbor night watch', NOW(), NOW()),
('70000000-0000-0000-0007-000000000007', 'Human Resources', 'harborlight-house', 'Culinary and hospitality staff coordination', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    hotel_id = EXCLUDED.hotel_id, 
    description = EXCLUDED.description;

-- Insert Employees for every hotel and department
INSERT INTO employees (id, employee_code, user_id, department_id, hotel_id, name, email, phone, position, joining_date, salary, role, is_active, created_at, updated_at) VALUES
-- The Palm House (Goa)
('a0000000-0000-0000-0001-000000000001', 'PHG-MGT-001', 'b0000000-0000-0000-0001-000000000001', '10000000-0000-0000-0001-000000000001', 'palm-house', 'Aryan Mehta', 'aryan.mehta@stayease.com', '+91 98201 11001', 'General Manager', '2023-01-15', 125000.00, 'MANAGER', true, NOW(), NOW()),
('a0000000-0000-0000-0001-000000000002', 'PHG-FO-001', 'b0000000-0000-0000-0001-000000000002', '10000000-0000-0000-0001-000000000002', 'palm-house', 'Diya Sharma', 'diya.sharma@stayease.com', '+91 98201 11002', 'Front Office Manager', '2023-03-01', 65000.00, 'SUPERVISOR', true, NOW(), NOW()),
('a0000000-0000-0000-0001-000000000003', 'PHG-HK-001', 'b0000000-0000-0000-0001-000000000003', '10000000-0000-0000-0001-000000000003', 'palm-house', 'Karan Rao', 'karan.rao@stayease.com', '+91 98201 11003', 'Housekeeping Supervisor', '2023-04-10', 52000.00, 'SUPERVISOR', true, NOW(), NOW()),
('a0000000-0000-0000-0001-000000000004', 'PHG-FB-001', 'b0000000-0000-0000-0001-000000000004', '10000000-0000-0000-0001-000000000004', 'palm-house', 'Ishita Roy', 'ishita.roy@stayease.com', '+91 98201 11004', 'Executive Chef', '2023-02-20', 82000.00, 'STAFF', true, NOW(), NOW()),
('a0000000-0000-0000-0001-000000000005', 'PHG-ENG-001', 'b0000000-0000-0000-0001-000000000005', '10000000-0000-0000-0001-000000000005', 'palm-house', 'Rohan Patel', 'rohan.patel@stayease.com', '+91 98201 11005', 'Chief Engineer', '2023-05-12', 60000.00, 'STAFF', true, NOW(), NOW()),
('a0000000-0000-0000-0001-000000000006', 'PHG-SEC-001', 'b0000000-0000-0000-0001-000000000006', '10000000-0000-0000-0001-000000000006', 'palm-house', 'Kabir Singh', 'kabir.singh@stayease.com', '+91 98201 11006', 'Head of Security', '2023-01-20', 48000.00, 'STAFF', true, NOW(), NOW()),
('a0000000-0000-0000-0001-000000000007', 'PHG-HR-001', 'b0000000-0000-0000-0001-000000000007', '10000000-0000-0000-0001-000000000007', 'palm-house', 'Meera Joshi', 'meera.joshi@stayease.com', '+91 98201 11007', 'HR Manager', '2023-02-01', 58000.00, 'STAFF', true, NOW(), NOW()),

-- Haveli & Co. (Jaipur)
('a0000000-0000-0000-0002-000000000001', 'HVC-MGT-001', 'b0000000-0000-0000-0002-000000000001', '20000000-0000-0000-0002-000000000001', 'haveli', 'Vikram Rathore', 'vikram.rathore@stayease.com', '+91 98202 22001', 'General Manager', '2023-01-10', 130000.00, 'MANAGER', true, NOW(), NOW()),
('a0000000-0000-0000-0002-000000000002', 'HVC-FO-001', 'b0000000-0000-0000-0002-000000000002', '20000000-0000-0000-0002-000000000002', 'haveli', 'Pooja Chauhan', 'pooja.chauhan@stayease.com', '+91 98202 22002', 'Front Desk Lead', '2023-04-15', 55000.00, 'SUPERVISOR', true, NOW(), NOW()),
('a0000000-0000-0000-0002-000000000003', 'HVC-HK-001', 'b0000000-0000-0000-0002-000000000003', '20000000-0000-0000-0002-000000000003', 'haveli', 'Dev Kumar', 'dev.kumar@stayease.com', '+91 98202 22003', 'Housekeeping Lead', '2023-06-01', 45000.00, 'STAFF', true, NOW(), NOW()),
('a0000000-0000-0000-0002-000000000004', 'HVC-FB-001', 'b0000000-0000-0000-0002-000000000004', '20000000-0000-0000-0002-000000000004', 'haveli', 'Manav Bhat', 'manav.bhat@stayease.com', '+91 98202 22004', 'Master Royal Chef', '2023-03-10', 78000.00, 'STAFF', true, NOW(), NOW()),

-- Lakehouse Retreat (Udaipur)
('a0000000-0000-0000-0003-000000000001', 'LHR-MGT-001', 'b0000000-0000-0000-0003-000000000001', '30000000-0000-0000-0003-000000000001', 'lakehouse', 'Siddharth Ranawat', 'siddharth.r@stayease.com', '+91 98203 33001', 'General Manager', '2023-02-01', 140000.00, 'MANAGER', true, NOW(), NOW()),
('a0000000-0000-0000-0003-000000000002', 'LHR-FO-001', 'b0000000-0000-0000-0003-000000000002', '30000000-0000-0000-0003-000000000002', 'lakehouse', 'Anaya Nair', 'anaya.nair@stayease.com', '+91 98203 33002', 'Head Concierge', '2023-04-01', 60000.00, 'SUPERVISOR', true, NOW(), NOW()),
('a0000000-0000-0000-0003-000000000003', 'LHR-HK-001', 'b0000000-0000-0000-0003-000000000003', '30000000-0000-0000-0003-000000000003', 'lakehouse', 'Pooja Menon', 'pooja.menon@stayease.com', '+91 98203 33003', 'Executive Housekeeper', '2023-05-15', 56000.00, 'SUPERVISOR', true, NOW(), NOW()),

-- Monsoon Grove Retreat (Munnar)
('a0000000-0000-0000-0004-000000000001', 'MGR-MGT-001', 'b0000000-0000-0000-0004-000000000001', '40000000-0000-0000-0004-000000000001', 'monsoon-grove', 'Mathew Thomas', 'mathew.thomas@stayease.com', '+91 98204 44001', 'General Manager', '2023-03-01', 115000.00, 'MANAGER', true, NOW(), NOW()),
('a0000000-0000-0000-0004-000000000002', 'MGR-FO-001', 'b0000000-0000-0000-0004-000000000002', '40000000-0000-0000-0004-000000000002', 'monsoon-grove', 'Nisha Pillai', 'nisha.pillai@stayease.com', '+91 98204 44002', 'Guest Relations Lead', '2023-05-01', 48000.00, 'STAFF', true, NOW(), NOW()),

-- Bluewater Cove Resort (Havelock Island)
('a0000000-0000-0000-0005-000000000001', 'BWC-MGT-001', 'b0000000-0000-0000-0005-000000000001', '50000000-0000-0000-0005-000000000001', 'bluewater-cove', 'Denzil Fernandez', 'denzil.f@stayease.com', '+91 98205 55001', 'General Manager', '2023-02-15', 135000.00, 'MANAGER', true, NOW(), NOW()),
('a0000000-0000-0000-0005-000000000002', 'BWC-FO-001', 'b0000000-0000-0000-0005-000000000002', '50000000-0000-0000-0005-000000000002', 'bluewater-cove', 'Zara D’Souza', 'zara.dsouza@stayease.com', '+91 98205 55002', 'Activities & Front Lead', '2023-04-18', 52000.00, 'STAFF', true, NOW(), NOW()),

-- Amber Courtyard Palace (Jaisalmer)
('a0000000-0000-0000-0006-000000000001', 'ACP-MGT-001', 'b0000000-0000-0000-0006-000000000001', '60000000-0000-0000-0006-000000000001', 'amber-courtyard', 'Bhawani Singh', 'bhawani.singh@stayease.com', '+91 98206 66001', 'General Manager', '2023-01-25', 120000.00, 'MANAGER', true, NOW(), NOW()),

-- Harborlight House (Kochi)
('a0000000-0000-0000-0007-000000000001', 'HLH-MGT-001', 'b0000000-0000-0000-0007-000000000001', '70000000-0000-0000-0007-000000000001', 'harborlight-house', 'George Varghese', 'george.v@stayease.com', '+91 98207 77001', 'General Manager', '2023-03-20', 110000.00, 'MANAGER', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    email = EXCLUDED.email, 
    phone = EXCLUDED.phone, 
    position = EXCLUDED.position,
    salary = EXCLUDED.salary,
    role = EXCLUDED.role,
    department_id = EXCLUDED.department_id,
    hotel_id = EXCLUDED.hotel_id,
    updated_at = NOW();

-- Link Department Heads
UPDATE departments SET head_id = 'a0000000-0000-0000-0001-000000000001' WHERE id = '10000000-0000-0000-0001-000000000001';
UPDATE departments SET head_id = 'a0000000-0000-0000-0001-000000000002' WHERE id = '10000000-0000-0000-0001-000000000002';
UPDATE departments SET head_id = 'a0000000-0000-0000-0001-000000000003' WHERE id = '10000000-0000-0000-0001-000000000003';
UPDATE departments SET head_id = 'a0000000-0000-0000-0002-000000000001' WHERE id = '20000000-0000-0000-0002-000000000001';
UPDATE departments SET head_id = 'a0000000-0000-0000-0003-000000000001' WHERE id = '30000000-0000-0000-0003-000000000001';

-- Insert Operational Tasks
INSERT INTO tasks (id, title, description, department_id, assignee_id, priority, status, due_date, created_at, updated_at) VALUES
('c0000000-0000-0000-0001-000000000001', 'VIP Check-in Preparation Suite 201', 'Verify private pool heating, fresh fruit platter and champagne setup', '10000000-0000-0000-0001-000000000002', 'a0000000-0000-0000-0001-000000000002', 'HIGH', 'IN_PROGRESS', NOW() + INTERVAL '4 hours', NOW(), NOW()),
('c0000000-0000-0000-0001-000000000002', 'Pool Pump Maintenance Inspection', 'Perform bi-weekly chlorination and mechanical check on main infinity pool pump', '10000000-0000-0000-0001-000000000005', 'a0000000-0000-0000-0001-000000000005', 'MEDIUM', 'PENDING', NOW() + INTERVAL '1 day', NOW(), NOW()),
('c0000000-0000-0000-0001-000000000003', 'Linen Inventory Audit', 'Count and log all luxury Egyptian cotton bedsheets and bath sheets across floors', '10000000-0000-0000-0001-000000000003', 'a0000000-0000-0000-0001-000000000003', 'NORMAL', 'COMPLETED', NOW() - INTERVAL '1 day', NOW(), NOW()),
('c0000000-0000-0000-0001-000000000004', 'Special Heritage Dinner Setup', 'Setup 8-course Maharaja tasting menu on the sunset terrace', '20000000-0000-0000-0002-000000000004', 'a0000000-0000-0000-0002-000000000004', 'HIGH', 'PENDING', NOW() + INTERVAL '6 hours', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    priority = EXCLUDED.priority,
    updated_at = NOW();

-- Insert Schedules
INSERT INTO schedules (id, employee_id, date, shift_start, shift_end, shift_type, notes) VALUES
('d0000000-0000-0000-0001-000000000001', 'a0000000-0000-0000-0001-000000000002', CURRENT_DATE, '07:00', '15:30', 'MORNING', 'Morning checkouts and guest departures'),
('d0000000-0000-0000-0001-000000000002', 'a0000000-0000-0000-0001-000000000003', CURRENT_DATE, '08:00', '16:30', 'MORNING', 'Supervising villa turnovers'),
('d0000000-0000-0000-0001-000000000003', 'a0000000-0000-0000-0001-000000000004', CURRENT_DATE, '14:00', '22:30', 'AFTERNOON', 'Coastal dinner service and menu prep'),
('d0000000-0000-0000-0001-000000000004', 'a0000000-0000-0000-0001-000000000006', CURRENT_DATE, '22:00', '06:30', 'NIGHT', 'Overnight resort perimeter security')
ON CONFLICT (id) DO UPDATE SET 
    shift_start = EXCLUDED.shift_start,
    shift_end = EXCLUDED.shift_end,
    notes = EXCLUDED.notes;


-- ============================================================
-- 2. hotel_auth_db (Users & Refresh Tokens)
-- ============================================================
\connect hotel_auth_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert system admin, managers, staff, and guest users
INSERT INTO users (id, email, password_hash, name, phone, role, is_active, created_at, updated_at) VALUES
('b0000000-0000-0000-0000-000000000001', 'admin@stayease.com', '$2a$10$bUCQ9DZwcFu86eiGfYkHA.yaHKpsulLsuOrYvTd0i5/KxstkhF2.W', 'Super Admin', '+91 98000 00001', 'ADMIN', true, NOW(), NOW()),
('b0000000-0000-0000-0001-000000000001', 'aryan.mehta@stayease.com', '$2a$10$bUCQ9DZwcFu86eiGfYkHA.yaHKpsulLsuOrYvTd0i5/KxstkhF2.W', 'Aryan Mehta', '+91 98201 11001', 'MANAGER', true, NOW(), NOW()),
('b0000000-0000-0000-0001-000000000002', 'diya.sharma@stayease.com', '$2a$10$bUCQ9DZwcFu86eiGfYkHA.yaHKpsulLsuOrYvTd0i5/KxstkhF2.W', 'Diya Sharma', '+91 98201 11002', 'STAFF', true, NOW(), NOW()),
('b0000000-0000-0000-0002-000000000001', 'vikram.rathore@stayease.com', '$2a$10$bUCQ9DZwcFu86eiGfYkHA.yaHKpsulLsuOrYvTd0i5/KxstkhF2.W', 'Vikram Rathore', '+91 98202 22001', 'MANAGER', true, NOW(), NOW()),
('b0000000-0000-0000-0003-000000000001', 'siddharth.r@stayease.com', '$2a$10$bUCQ9DZwcFu86eiGfYkHA.yaHKpsulLsuOrYvTd0i5/KxstkhF2.W', 'Siddharth Ranawat', '+91 98203 33001', 'MANAGER', true, NOW(), NOW()),

-- Guest Customers
('e0000000-0000-0000-0001-000000000001', 'aarav.shah@gmail.com', '$2a$10$bUCQ9DZwcFu86eiGfYkHA.yaHKpsulLsuOrYvTd0i5/KxstkhF2.W', 'Aarav Shah', '+91 91000 00101', 'CUSTOMER', true, NOW(), NOW()),
('e0000000-0000-0000-0001-000000000002', 'mira.desai@gmail.com', '$2a$10$bUCQ9DZwcFu86eiGfYkHA.yaHKpsulLsuOrYvTd0i5/KxstkhF2.W', 'Mira Desai', '+91 91000 00102', 'CUSTOMER', true, NOW(), NOW()),
('e0000000-0000-0000-0001-000000000003', 'rohan.malik@gmail.com', '$2a$10$bUCQ9DZwcFu86eiGfYkHA.yaHKpsulLsuOrYvTd0i5/KxstkhF2.W', 'Rohan Malik', '+91 91000 00103', 'CUSTOMER', true, NOW(), NOW()),
('e0000000-0000-0000-0001-000000000004', 'sana.reddy@gmail.com', '$2a$10$bUCQ9DZwcFu86eiGfYkHA.yaHKpsulLsuOrYvTd0i5/KxstkhF2.W', 'Sana Reddy', '+91 91000 00104', 'CUSTOMER', true, NOW(), NOW()),
('e0000000-0000-0000-0001-000000000005', 'kabir.sen@gmail.com', '$2a$10$bUCQ9DZwcFu86eiGfYkHA.yaHKpsulLsuOrYvTd0i5/KxstkhF2.W', 'Kabir Sen', '+91 91000 00105', 'CUSTOMER', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    updated_at = NOW();
