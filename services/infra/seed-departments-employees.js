/**
 * StayEase Enterprise Hotel Platform - Departments & Employees Seeder
 *
 * Dynamically queries all active hotels from MongoDB (hotel_catalog.hotels)
 * For each hotel:
 *   1. Inserts standard departments in MongoDB (hotel_departments.departments)
 *      with deterministic 24-character ObjectIds.
 *   2. Mirrors departments in PostgreSQL (hotel_operations_db.departments).
 *   3. Inserts realistic department-linked employees in PostgreSQL (hotel_operations_db.employees)
 *      with unique employee codes, realistic salaries, positions, and permissions.
 *   4. Updates department head_id in both MongoDB and PostgreSQL to the manager employee.
 *   5. Generates operational tasks and shift schedules for the employees.
 */

const crypto = require('crypto');
const path = require('path');
const mongoose = require(path.resolve(__dirname, '../operations-service/node_modules/mongoose'));
const { PrismaClient } = require(path.resolve(__dirname, '../operations-service/node_modules/@prisma/client'));

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const POSTGRES_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:55432/hotel_operations_db?schema=public';

// Helper to create a deterministic 24-char hex string (valid MongoDB ObjectId)
function createDeterministicObjectId(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return new mongoose.Types.ObjectId(hash.substring(0, 24));
}

// Helper to create a deterministic UUID
function createDeterministicUUID(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16), // version 4
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20), // variant
    hash.substring(20, 32)
  ].join('-');
}

// Helper to extract 2-4 letter uppercase short code from hotel name or slug
function getHotelShortCode(name, slug) {
  if (name && name.trim()) {
    const words = name.trim().split(/[\s-_]+/);
    if (words.length > 1) {
      return words.map(w => w[0]).join('').toUpperCase().slice(0, 4);
    }
    return name.trim().slice(0, 3).toUpperCase();
  }
  if (slug && slug.trim()) {
    const words = slug.trim().split(/[\s-_]+/);
    if (words.length > 1) {
      return words.map(w => w[0]).join('').toUpperCase().slice(0, 4);
    }
    return slug.trim().slice(0, 3).toUpperCase();
  }
  return 'HTL';
}

// Department definitions template
const DEPARTMENT_TEMPLATES = [
  {
    name: 'Front Office',
    description: 'Guest arrivals, concierge, reservations, keycard management, and 24/7 lobby hospitality experiences.',
    employees: [
      { position: 'Front Desk Manager', role: 'MANAGER', isHead: true, salary: 78000, firstNames: ['Arjun', 'Rohit', 'Siddharth', 'Aditya', 'Sameer', 'Vikram', 'Nikhil'], lastNames: ['Sharma', 'Verma', 'Mehta', 'Kapoor', 'Deshmukh', 'Singhania', 'Chopra'] },
      { position: 'Senior Concierge Specialist', role: 'STAFF', isHead: false, salary: 48000, firstNames: ['Pooja', 'Ananya', 'Meera', 'Riya', 'Kavita', 'Tanvi', 'Isha'], lastNames: ['Nair', 'Patel', 'Menon', 'Bhatt', 'Rao', 'Iyer', 'Pillai'] },
      { position: 'Guest Relations Associate', role: 'STAFF', isHead: false, salary: 42000, firstNames: ['Dev', 'Kabir', 'Aman', 'Karan', 'Aryan', 'Varun', 'Rohan'], lastNames: ['Joshi', 'Saxena', 'Mukherjee', 'Banerjee', 'Roy', 'Dutta', 'Das'] }
    ]
  },
  {
    name: 'Housekeeping',
    description: 'Villa cleaning, turndown service, Egyptian cotton linen management, and public area sanitation.',
    employees: [
      { position: 'Executive Housekeeper', role: 'MANAGER', isHead: true, salary: 72000, firstNames: ['Sunita', 'Rekha', 'Manju', 'Geeta', 'Lakshmi', 'Shalini', 'Kalyani'], lastNames: ['Kaur', 'Gowda', 'Reddy', 'Chauhan', 'Thakur', 'Yadav', 'Mahajan'] },
      { position: 'Floor Supervisor', role: 'STAFF', isHead: false, salary: 40000, firstNames: ['Ramesh', 'Suresh', 'Dinesh', 'Mahesh', 'Ganesh', 'Rajesh', 'Santosh'], lastNames: ['Singh', 'Kumar', 'Prasad', 'Mandal', 'Pandey', 'Mishra', 'Tiwari'] },
      { position: 'Senior Room Attendant', role: 'STAFF', isHead: false, salary: 34000, firstNames: ['Anita', 'Suman', 'Babita', 'Sarita', 'Poonam', 'Radha', 'Kiran'], lastNames: ['Devi', 'Bano', 'Patil', 'Shinde', 'Kamble', 'Jadhav', 'Kadam'] }
    ]
  },
  {
    name: 'Food & Beverage',
    description: 'Fine dining signature restaurant, coastal poolside bar, sunset cocktail lounge, and 24/7 private villa dining.',
    employees: [
      { position: 'Executive Chef', role: 'MANAGER', isHead: true, salary: 110000, firstNames: ['Sanjeev', 'Ranveer', 'Vikas', 'Kunal', 'Manish', 'Atul', 'Gaurav'], lastNames: ['Brar', 'Kapoor', 'Khanna', 'Mehrotra', 'Kochhar', 'Arora', 'Malhotra'] },
      { position: 'Restaurant & Bar Manager', role: 'STAFF', isHead: false, salary: 62000, firstNames: ['Neha', 'Simran', 'Shruti', 'Anushka', 'Natasha', 'Rhea', 'Tara'], lastNames: ['Fernandes', 'D\'Souza', 'Albuquerque', 'Lobo', 'Pereira', 'Rodrigues', 'Pinto'] },
      { position: 'Senior Sous Chef', role: 'STAFF', isHead: false, salary: 55000, firstNames: ['Amit', 'Prateek', 'Rahul', 'Vivek', 'Sachin', 'Deepak', 'Manish'], lastNames: ['Gupta', 'Aggarwal', 'Bansal', 'Goyal', 'Mittal', 'Jindal', 'Singla'] }
    ]
  },
  {
    name: 'Maintenance & Engineering',
    description: 'HVAC systems, electrical distribution, solar heating, infinity pool filtration, and comprehensive facility engineering.',
    employees: [
      { position: 'Chief Engineer', role: 'MANAGER', isHead: true, salary: 88000, firstNames: ['Rajiv', 'Ashok', 'Satish', 'Praveen', 'Sanjay', 'Mukesh', 'Harish'], lastNames: ['Narayanan', 'Subramanian', 'Krishnan', 'Venkatesh', 'Ranganathan', 'Balasubramanian', 'Swaminathan'] },
      { position: 'Facilities & HVAC Technician', role: 'STAFF', isHead: false, salary: 42000, firstNames: ['Vijay', 'Anand', 'Sanjay', 'Brijesh', 'Manoj', 'Ashwani', 'Pankaj'], lastNames: ['Dubey', 'Tripathi', 'Chaubey', 'Upadhyay', 'Awasthi', 'Shukla', 'Bajpai'] }
    ]
  },
  {
    name: 'Security & Safety',
    description: '24/7 guest protection, intelligent CCTV monitoring, fire & life safety protocols, and estate perimeter security.',
    employees: [
      { position: 'Director of Safety & Security', role: 'MANAGER', isHead: true, salary: 68000, firstNames: ['Balwinder', 'Gurpreet', 'Harpreet', 'Jaswinder', 'Sukhwinder', 'Manpreet', 'Ravinder'], lastNames: ['Sandhu', 'Gill', 'Dhillon', 'Grewal', 'Sidhu', 'Brar', 'Virk'] },
      { position: 'Surveillance & Patrol Specialist', role: 'STAFF', isHead: false, salary: 36000, firstNames: ['Bhupender', 'Dharmender', 'Harendra', 'Jitender', 'Narender', 'Surender', 'Virender'], lastNames: ['Rana', 'Rawat', 'Negi', 'Bist', 'Bisht', 'Kandari', 'Payal'] }
    ]
  },
  {
    name: 'Management & Executive',
    description: 'General property governance, VIP guest hosting, financial performance, and world-class luxury standards.',
    employees: [
      { position: 'General Manager', role: 'ADMIN', isHead: true, salary: 180000, firstNames: ['Vikramaditya', 'Raghavendra', 'Yashodhan', 'Digvijay', 'Prithviraj', 'Suryaveer', 'Ranvijay'], lastNames: ['Singhania', 'Rathore', 'Scindia', 'Bhawani', 'Shekhawat', 'Chundawat', 'Khangarot'] },
      { position: 'Assistant General Manager', role: 'MANAGER', isHead: false, salary: 115000, firstNames: ['Ayesha', 'Dia', 'Mallika', 'Nandini', 'Gayatri', 'Mrinalini', 'Devika'], lastNames: ['Bose', 'Sengupta', 'Chatterjee', 'Chakraborty', 'Ganguly', 'Ghosh', 'Bhattacharya'] }
    ]
  },
  {
    name: 'Spa & Wellness',
    description: 'Traditional Ayurvedic therapies, holistic herbal massages, sound healing, morning beach yoga, and vitality spa.',
    employees: [
      { position: 'Spa & Wellness Director', role: 'MANAGER', isHead: true, salary: 76000, firstNames: ['Maya', 'Indira', 'Arundhati', 'Vasundhara', 'Padma', 'Kalpana', 'Shobhana'], lastNames: ['Warrier', 'Kurup', 'Panicker', 'Nambiar', 'Marar', 'Pisharody', 'Unnithan'] },
      { position: 'Senior Ayurvedic Therapist', role: 'STAFF', isHead: false, salary: 50000, firstNames: ['Anjali', 'Kalyani', 'Parvathi', 'Lalitha', 'Devayani', 'Revathi', 'Sujata'], lastNames: ['Pillai', 'Achari', 'Variar', 'Kartha', 'Nedungadi', 'Valiathan', 'Thampy'] }
    ]
  }
];

// Helper to choose name deterministically based on hotel index
function pickName(nameList, hotelIndex, employeeIndex) {
  const idx = (hotelIndex * 3 + employeeIndex) % nameList.length;
  return nameList[idx];
}

async function seedDepartmentsAndEmployees() {
  console.log('='.repeat(70));
  console.log('ðŸ¨ StayEase Master Seeder: Departments & Employees across Hotels');
  console.log('='.repeat(70));

  // 1. Connect to MongoDB
  console.log('\n[1/5] Connecting to MongoDB databases...');
  const catalogConn = await mongoose.createConnection(`${MONGO_URI}/hotel_catalog`);
  const departmentsConn = await mongoose.createConnection(`${MONGO_URI}/hotel_departments`);
  console.log('âœ… Connected to MongoDB hotel_catalog & hotel_departments');

  // 2. Connect to PostgreSQL via Prisma
  console.log('\n[2/5] Connecting to PostgreSQL hotel_operations_db via Prisma...');
  const prisma = new PrismaClient({
    datasources: {
      db: { url: POSTGRES_URL }
    }
  });
  await prisma.$connect();
  console.log('âœ… Connected to PostgreSQL hotel_operations_db');

  // 3. Ensure PostgreSQL departments table exists with VARCHAR id
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS departments (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(64) NOT NULL,
      hotel_id VARCHAR(64) NOT NULL,
      description TEXT,
      head_id VARCHAR(64),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_departments_hotel ON departments (hotel_id);
  `);

  // 4. Fetch all active hotels from hotel_catalog
  console.log('\n[3/5] Fetching all hotels from hotel_catalog...');
  const hotels = await catalogConn.collection('hotels').find({ isActive: true }).toArray();
  console.log(`Found ${hotels.length} active hotels in catalog.`);

  if (hotels.length === 0) {
    console.error('âŒ No active hotels found in hotel_catalog. Please seed hotels first!');
    process.exit(1);
  }

  const deptCollection = departmentsConn.collection('departments');
  const allSeededEmployees = [];
  const allSeededDepartments = [];

  // 5. Iterate through each hotel and seed departments and employees
  console.log('\n[4/5] Seeding Departments and Employees for each property...');

  for (let hIdx = 0; hIdx < hotels.length; hIdx++) {
    const hotel = hotels[hIdx];
    const hotelIdStr = hotel._id.toString();
    const hotelSlug = hotel.slug || hotel.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const hotelShort = getHotelShortCode(hotel.name, hotelSlug);

    console.log(`\nðŸ¨ [${hIdx + 1}/${hotels.length}] Property: ${hotel.name} (${hotel.city}) [ID: ${hotelIdStr}] [Short: ${hotelShort}]`);

    let empSeqCounter = 1;

    for (let dIdx = 0; dIdx < DEPARTMENT_TEMPLATES.length; dIdx++) {
      const template = DEPARTMENT_TEMPLATES[dIdx];

      // Generate deterministic 24-char ObjectId for the department
      const deptObjectId = createDeterministicObjectId(`dept_${hotelIdStr}_${template.name}`);
      const deptIdStr = deptObjectId.toString();

      // Upsert department in MongoDB hotel_departments
      await deptCollection.updateOne(
        { _id: deptObjectId },
        {
          $set: {
            name: template.name,
            hotelId: hotelIdStr,
            description: template.description,
            isActive: true,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );

      // Upsert department in PostgreSQL hotel_operations_db
      await prisma.$executeRawUnsafe(`
        INSERT INTO departments (id, name, hotel_id, description, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          hotel_id = EXCLUDED.hotel_id,
          description = EXCLUDED.description,
          updated_at = NOW();
      `, deptIdStr, template.name, hotelIdStr, template.description);

      // Also ensure lookup by hotelSlug works in Postgres
      const slugDeptId = createDeterministicObjectId(`dept_${hotelSlug}_${template.name}`).toString();
      await prisma.$executeRawUnsafe(`
        INSERT INTO departments (id, name, hotel_id, description, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, slugDeptId, template.name, hotelSlug, template.description);

      allSeededDepartments.push({ id: deptIdStr, name: template.name, hotelId: hotelIdStr });

      let deptHeadEmployeeId = null;

      // Seed employees for this department
      for (let eIdx = 0; eIdx < template.employees.length; eIdx++) {
        const empTemplate = template.employees[eIdx];
        const firstName = pickName(empTemplate.firstNames, hIdx, eIdx);
        const lastName = pickName(empTemplate.lastNames, hIdx, eIdx);
        const fullName = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${hotelShort.toLowerCase()}@stayease.com`;
        const phone = `+91 ${98000 + (hIdx * 10) + eIdx} ${String(10000 + (hIdx * 100) + (dIdx * 10) + eIdx).padStart(5, '0')}`;

        const employeeId = createDeterministicUUID(`emp_${hotelIdStr}_${template.name}_${eIdx}`);
        const userId = createDeterministicUUID(`user_${hotelIdStr}_${template.name}_${eIdx}`);
        const employeeCode = `${hotelShort}/EMP/${String(empSeqCounter).padStart(4, '0')}`;
        empSeqCounter++;

        const permissions = empTemplate.role === 'ADMIN'
          ? { all: { manage: true } }
          : empTemplate.role === 'MANAGER'
          ? {
              departments: { view: true, edit: true },
              employees: { view: true, edit: true, create: true },
              tasks: { view: true, create: true, edit: true, delete: true },
              reports: { view: true }
            }
          : {
              tasks: { view: true, edit: true },
              rooms: { view: true },
              schedules: { view: true }
            };

        const joiningDate = new Date(Date.now() - (180 + (hIdx * 40) + (eIdx * 25)) * 24 * 60 * 60 * 1000);

        // Upsert Employee into PostgreSQL
        await prisma.$executeRawUnsafe(`
          INSERT INTO employees (
            id, employee_code, user_id, department_id, hotel_id,
            name, email, phone, position, joining_date,
            salary, role, permissions, is_active, created_at, updated_at
          )
          VALUES (
            $1::uuid, $2, $3::uuid, $4, $5,
            $6, $7, $8, $9, $10::date,
            $11, $12, $13::jsonb, true, NOW(), NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            employee_code = EXCLUDED.employee_code,
            department_id = EXCLUDED.department_id,
            hotel_id = EXCLUDED.hotel_id,
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            position = EXCLUDED.position,
            salary = EXCLUDED.salary,
            role = EXCLUDED.role,
            permissions = EXCLUDED.permissions,
            is_active = true,
            updated_at = NOW();
        `,
          employeeId,
          employeeCode,
          userId,
          deptIdStr,
          hotelIdStr,
          fullName,
          email,
          phone,
          empTemplate.position,
          joiningDate.toISOString().split('T')[0],
          empTemplate.salary,
          empTemplate.role,
          JSON.stringify(permissions)
        );

        if (empTemplate.isHead) {
          deptHeadEmployeeId = employeeId;
        }

        allSeededEmployees.push({
          id: employeeId,
          code: employeeCode,
          name: fullName,
          position: empTemplate.position,
          hotelName: hotel.name,
          departmentName: template.name
        });
      }

      // Link Department Head in both MongoDB and PostgreSQL
      if (deptHeadEmployeeId) {
        await deptCollection.updateOne(
          { _id: deptObjectId },
          { $set: { headId: deptHeadEmployeeId } }
        );

        await prisma.$executeRawUnsafe(`
          UPDATE departments SET head_id = $1 WHERE id = $2;
        `, deptHeadEmployeeId, deptIdStr);
      }
    }

    console.log(`   âœ¨ Seeded ${DEPARTMENT_TEMPLATES.length} departments & ${empSeqCounter - 1} employees for ${hotel.name}`);
  }

  // 6. Seed Operational Tasks for Staff
  console.log('\n[5/5] Seeding Operational Tasks and Shift Schedules...');
  const sampleTasks = [
    { title: 'VIP Suite Arrival Preparation', desc: 'Inspect heated plunge pool, arrange fresh exotic fruit basket and chilling champagne.', priority: 'HIGH', deptName: 'Front Office' },
    { title: 'Egyptian Cotton Linen Inventory Audit', desc: 'Verify stock levels and log all 400-thread-count bed linen and plush towels.', priority: 'MEDIUM', deptName: 'Housekeeping' },
    { title: 'Executive Chef Sunset Tasting Menu Setup', desc: 'Coordinate multi-course seasonal dinner presentation for terrace guests.', priority: 'HIGH', deptName: 'Food & Beverage' },
    { title: 'Infinity Pool Pump Filtration Inspection', desc: 'Perform chemical balance check and bi-weekly mechanical pump maintenance.', priority: 'MEDIUM', deptName: 'Maintenance & Engineering' },
    { title: 'Perimeter Security & Night Surveillance Patrol', desc: 'Conduct thorough inspection of estate perimeter, beach access, and CCTV logs.', priority: 'MEDIUM', deptName: 'Security & Safety' },
    { title: 'Herbal Massage Therapy Room Sanitization', desc: 'Prepare organic aromatic oils and sanitize massage tables before morning appointments.', priority: 'NORMAL', deptName: 'Spa & Wellness' }
  ];

  let taskCount = 0;
  for (let i = 0; i < Math.min(hotels.length * 2, 20); i++) {
    const hotel = hotels[i % hotels.length];
    const hotelIdStr = hotel._id.toString();
    const taskTpl = sampleTasks[i % sampleTasks.length];
    const dept = allSeededDepartments.find(d => d.hotelId === hotelIdStr && d.name.includes(taskTpl.deptName.split(' ')[0]));
    const assignee = allSeededEmployees.find(e => e.hotelName === hotel.name && e.departmentName.includes(taskTpl.deptName.split(' ')[0]));

    if (dept && assignee) {
      const taskId = createDeterministicUUID(`task_${hotelIdStr}_${i}`);
      const dueDate = new Date(Date.now() + ((i % 3) + 1) * 6 * 60 * 60 * 1000);
      const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
      const status = statuses[i % statuses.length];

      await prisma.$executeRawUnsafe(`
        INSERT INTO tasks (id, title, description, department_id, assignee_id, priority, status, due_date, created_at, updated_at)
        VALUES ($1::uuid, $2, $3, $4, $5::uuid, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          updated_at = NOW();
      `, taskId, taskTpl.title, taskTpl.desc, dept.id, assignee.id, taskTpl.priority, status, dueDate);
      taskCount++;
    }
  }

  // Shift Schedules
  let scheduleCount = 0;
  const shifts = [
    { start: '07:00', end: '15:30', type: 'MORNING' },
    { start: '15:00', end: '23:30', type: 'AFTERNOON' },
    { start: '23:00', end: '07:30', type: 'NIGHT' }
  ];

  for (let i = 0; i < Math.min(allSeededEmployees.length, 30); i++) {
    const emp = allSeededEmployees[i];
    const shift = shifts[i % shifts.length];
    const scheduleId = createDeterministicUUID(`sched_${emp.id}_today`);
    const today = new Date().toISOString().split('T')[0];

    await prisma.$executeRawUnsafe(`
      INSERT INTO schedules (id, employee_id, date, shift_start, shift_end, shift_type, notes)
      VALUES ($1::uuid, $2::uuid, $3::date, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        shift_start = EXCLUDED.shift_start,
        shift_end = EXCLUDED.shift_end,
        shift_type = EXCLUDED.shift_type;
    `, scheduleId, emp.id, today, shift.start, shift.end, shift.type, `${shift.type} shift for ${emp.position}`);
    scheduleCount++;
  }

  // Summary counts
  const totalMongoDepts = await deptCollection.countDocuments();
  const totalPgDepts = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int as count FROM departments');
  const totalEmployees = await prisma.employee.count();
  const totalTasks = await prisma.task.count();
  const totalSchedules = await prisma.schedule.count();

  console.log('\n' + '='.repeat(70));
  console.log('ðŸŽ‰ SEEDING COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(70));
  console.log(`ðŸ“Š Total Hotels Processed:                ${hotels.length}`);
  console.log(`ðŸ“Š Departments in MongoDB hotel_departments: ${totalMongoDepts}`);
  console.log(`ðŸ“Š Departments in PostgreSQL operations_db:  ${totalPgDepts[0].count}`);
  console.log(`ðŸ“Š Employees in PostgreSQL operations_db:    ${totalEmployees}`);
  console.log(`ðŸ“Š Tasks in PostgreSQL operations_db:        ${totalTasks}`);
  console.log(`ðŸ“Š Schedules in PostgreSQL operations_db:    ${totalSchedules}`);
  console.log('='.repeat(70));

  // Disconnect cleanly
  await catalogConn.close();
  await departmentsConn.close();
  await prisma.$disconnect();
}

seedDepartmentsAndEmployees().catch((err) => {
  console.error('\nâŒ Seeding failed with error:', err);
  process.exit(1);
});
