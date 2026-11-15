const API_BASE_URL = (
  process.env.SEED_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1"
).replace(/\/$/, "");

const hotelDefinitions = [
  {
    slug: "palm-house",
    name: "The Palm House",
    city: "Goa",
    location: "Candolim, Goa",
    mainImage: "/assets/figma/a0108.png",
    galleryImages: ["/assets/figma/a0108.png", "/assets/figma/185bf.png", "/assets/figma/b62b5.png"],
    basePrice: 8000,
    rating: 4.8,
    reviewsCount: 324,
    tag: "Your coastal escape",
    offer: "10% off your first stay",
    category: "Beach resorts",
    description: "A relaxed boutique resort near Candolim Beach, with tropical gardens, dining, and wellness amenities.",
    amenities: ["Free Wi-Fi", "Infinity Pool", "Complimentary Breakfast", "Spa & Wellness", "Beach Access", "Bar & Lounge"],
  },
  {
    slug: "haveli",
    name: "Haveli & Co.",
    city: "Jaipur",
    location: "Civil Lines, Jaipur",
    mainImage: "/assets/figma/185bf.png",
    galleryImages: ["/assets/figma/185bf.png", "/assets/figma/b62b5.png"],
    basePrice: 6500,
    rating: 4.9,
    reviewsCount: 218,
    tag: "Heritage hideaway",
    offer: "Breakfast on us",
    category: "Heritage stays",
    description: "A restored heritage stay with a courtyard, handcrafted decor, and rooftop dining.",
    amenities: ["Free Wi-Fi", "Swimming Pool", "Heritage Courtyard", "Rooftop Restaurant", "Cultural Evenings"],
  },
  {
    slug: "lakehouse",
    name: "Lakehouse Retreat",
    city: "Udaipur",
    location: "Lake Pichola, Udaipur",
    mainImage: "/assets/figma/b62b5.png",
    galleryImages: ["/assets/figma/b62b5.png", "/assets/figma/a0108.png"],
    basePrice: 12400,
    rating: 4.9,
    reviewsCount: 186,
    tag: "Lakeside luxury",
    offer: "Save 15% on 3+ nights",
    category: "Boutique hotels",
    description: "A lakeside retreat with panoramic views, fine dining, and private boat transfers.",
    amenities: ["Lake View", "Infinity Pool", "Fine Dining", "Private Boat Transfer", "Butler Service"],
  },
  {
    slug: "monsoon-grove",
    name: "Monsoon Grove Retreat",
    city: "Munnar",
    location: "Pallivasal, Munnar",
    mainImage: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1200",
    galleryImages: ["https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1200"],
    basePrice: 8800,
    rating: 4.8,
    reviewsCount: 154,
    tag: "A hideaway in the hills",
    offer: "Save 12% on a 2-night stay",
    category: "Villas & retreats",
    description: "A quiet hillside retreat in Munnar, surrounded by tea country and walking trails.",
    amenities: ["Free Wi-Fi", "Mountain View", "Breakfast", "Nature Walks"],
  },
  {
    slug: "bluewater-cove",
    name: "Bluewater Cove Resort",
    city: "Havelock Island",
    location: "Vijay Nagar Beach, Havelock Island",
    mainImage: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1200",
    galleryImages: ["https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=1200"],
    basePrice: 11200,
    rating: 4.9,
    reviewsCount: 207,
    tag: "Island time, well spent",
    offer: "Complimentary airport transfer",
    category: "Beach resorts",
    description: "A relaxed island resort near Vijay Nagar Beach with coastal dining and easy access to snorkeling.",
    amenities: ["Free Wi-Fi", "Beach Access", "Swimming Pool", "Snorkeling"],
  },
  {
    slug: "amber-courtyard",
    name: "Amber Courtyard Palace",
    city: "Jaisalmer",
    location: "Fort Road, Jaisalmer",
    mainImage: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1200",
    galleryImages: ["https://images.pexels.com/photos/1001965/pexels-photo-1001965.jpeg?auto=compress&cs=tinysrgb&w=1200"],
    basePrice: 7600,
    rating: 4.7,
    reviewsCount: 132,
    tag: "Desert heritage, warmly hosted",
    offer: "Desert dinner included",
    category: "Heritage stays",
    description: "A desert heritage stay with traditional details, courtyard dining, and guided local experiences.",
    amenities: ["Free Wi-Fi", "Heritage Courtyard", "Cultural Evenings", "Rooftop Restaurant"],
  },
  {
    slug: "harborlight-house",
    name: "Harborlight House",
    city: "Kochi",
    location: "Fort Kochi, Kochi",
    mainImage: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=1200",
    galleryImages: ["https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=1200"],
    basePrice: 6900,
    rating: 4.8,
    reviewsCount: 176,
    tag: "A slower side of the city",
    offer: "Free late checkout",
    category: "City hotels",
    description: "A small city hotel in historic Fort Kochi, close to the waterfront and local galleries.",
    amenities: ["Free Wi-Fi", "Breakfast", "Rooftop Restaurant", "Historic District"],
  },
];

const roomDefinitionsByHotel = {
  "palm-house": [
    { name: "Deluxe King Room", description: "A comfortable king room with pool views.", price: 8000, capacity: 2, totalInventory: 5, bedType: "King Bed", roomSize: "380 sq.ft", image: "/assets/figma/a0108.png", amenities: ["Free Wi-Fi", "Pool View", "Mini Bar", "Air Conditioning"] },
    { name: "Ocean View Villa", description: "A spacious villa with a private plunge pool and balcony.", price: 14500, capacity: 4, totalInventory: 3, bedType: "2 King Beds", roomSize: "750 sq.ft", image: "/assets/figma/185bf.png", amenities: ["Private Plunge Pool", "Balcony", "Free Wi-Fi", "Espresso Machine"] },
  ],
  haveli: [
    { name: "Heritage Royal Suite", description: "A heritage suite with handcrafted decor and courtyard views.", price: 6500, capacity: 2, totalInventory: 6, bedType: "Four-Poster King", roomSize: "420 sq.ft", image: "/assets/figma/185bf.png", amenities: ["Courtyard View", "Handcrafted Decor", "Bathtub", "Free Wi-Fi"] },
    { name: "Courtyard Family Room", description: "A family room overlooking the haveli courtyard.", price: 9200, capacity: 4, totalInventory: 4, bedType: "King Bed + Twin Beds", roomSize: "620 sq.ft", image: "/assets/figma/b62b5.png", amenities: ["Courtyard View", "Free Wi-Fi", "Breakfast", "Air Conditioning"] },
  ],
  lakehouse: [
    { name: "Lakefront Palace Room", description: "A lake-facing room with a private balcony.", price: 12400, capacity: 2, totalInventory: 4, bedType: "King Bed", roomSize: "500 sq.ft", image: "/assets/figma/b62b5.png", amenities: ["Lake Pichola View", "Private Balcony", "Butler Service", "Free Wi-Fi"] },
    { name: "Royal Lake Suite", description: "A larger suite with lake views and a separate lounge.", price: 18500, capacity: 4, totalInventory: 2, bedType: "King Bed + Sofa Bed", roomSize: "820 sq.ft", image: "/assets/figma/a0108.png", amenities: ["Panoramic Lake View", "Separate Lounge", "Butler Service", "Free Wi-Fi"] },
  ],
};

const departmentDefinitions = [
  { name: "Management", description: "Property leadership and daily operations" },
  { name: "Front Office", description: "Reception, reservations, and guest services" },
  { name: "Housekeeping", description: "Room cleaning, laundry, and inspections" },
  { name: "Food & Beverage", description: "Restaurant and kitchen operations" },
  { name: "Maintenance", description: "Building, room, and equipment maintenance" },
  { name: "Security", description: "Guest and property safety" },
  { name: "Human Resources", description: "Hiring, employee support, and records" },
  { name: "Finance", description: "Accounting and financial administration" },
  { name: "Sales & Marketing", description: "Sales, partnerships, and marketing" },
  { name: "Stores & Inventory", description: "Purchasing and property inventory" },
];

const employeeDefinitions = [
  { name: "Aryan Mehta", email: "aryan.mehta@example.test", phone: "9000000101", position: "General Manager", department: "Management", role: "HOTEL_MANAGER", salary: 125000 },
  { name: "Nisha Kapoor", email: "nisha.kapoor@example.test", phone: "9000000102", position: "Assistant Manager", department: "Management", role: "HOTEL_MANAGER", salary: 85000 },
  { name: "Diya Sharma", email: "diya.sharma@example.test", phone: "9000000103", position: "Front Office Manager", department: "Front Office", role: "FRONT_DESK", salary: 62000 },
  { name: "Vikram Das", email: "vikram.das@example.test", phone: "9000000104", position: "Front Desk Associate", department: "Front Office", role: "FRONT_DESK", salary: 34000 },
  { name: "Sara Khan", email: "sara.khan@example.test", phone: "9000000105", position: "Reservations Executive", department: "Front Office", role: "FRONT_DESK", salary: 36000 },
  { name: "Karan Rao", email: "karan.rao@example.test", phone: "9000000106", position: "Housekeeping Supervisor", department: "Housekeeping", role: "HOUSEKEEPING_SUPERVISOR", salary: 52000 },
  { name: "Pooja Menon", email: "pooja.menon@example.test", phone: "9000000107", position: "Room Attendant", department: "Housekeeping", role: "STAFF", salary: 28000 },
  { name: "Dev Kumar", email: "dev.kumar@example.test", phone: "9000000108", position: "Laundry Attendant", department: "Housekeeping", role: "STAFF", salary: 26000 },
  { name: "Anaya Nair", email: "anaya.nair@example.test", phone: "9000000109", position: "Restaurant Supervisor", department: "Food & Beverage", role: "STAFF", salary: 48000 },
  { name: "Ishita Roy", email: "ishita.roy@example.test", phone: "9000000110", position: "Chef", department: "Food & Beverage", role: "STAFF", salary: 46000 },
  { name: "Manav Bhat", email: "manav.bhat@example.test", phone: "9000000111", position: "Restaurant Server", department: "Food & Beverage", role: "STAFF", salary: 29000 },
  { name: "Rohan Patel", email: "rohan.patel@example.test", phone: "9000000112", position: "Maintenance Supervisor", department: "Maintenance", role: "STAFF", salary: 50000 },
  { name: "Aditi Bose", email: "aditi.bose@example.test", phone: "9000000113", position: "Maintenance Technician", department: "Maintenance", role: "STAFF", salary: 35000 },
  { name: "Kabir Singh", email: "kabir.singh@example.test", phone: "9000000114", position: "Security Supervisor", department: "Security", role: "STAFF", salary: 43000 },
  { name: "Tara Pillai", email: "tara.pillai@example.test", phone: "9000000115", position: "Security Officer", department: "Security", role: "STAFF", salary: 30000 },
  { name: "Meera Joshi", email: "meera.joshi@example.test", phone: "9000000116", position: "HR Executive", department: "Human Resources", role: "STAFF", salary: 44000 },
  { name: "Priya Iyer", email: "priya.iyer@example.test", phone: "9000000117", position: "Accountant", department: "Finance", role: "AUDITOR", salary: 51000 },
  { name: "Arjun Kapoor", email: "arjun.kapoor@example.test", phone: "9000000118", position: "Sales Manager", department: "Sales & Marketing", role: "STAFF", salary: 58000 },
  { name: "Leela Fernandes", email: "leela.fernandes@example.test", phone: "9000000119", position: "Marketing Associate", department: "Sales & Marketing", role: "STAFF", salary: 39000 },
  { name: "Ishaan Verma", email: "ishaan.verma@example.test", phone: "9000000120", position: "Inventory Officer", department: "Stores & Inventory", role: "STAFF", salary: 33000 },
];

const reservationGuests = [
  { firstName: "Aarav", lastName: "Shah", email: "aarav.shah.guest@example.test", phone: "9100000101" },
  { firstName: "Mira", lastName: "Desai", email: "mira.desai.guest@example.test", phone: "9100000102" },
  { firstName: "Rohan", lastName: "Malik", email: "rohan.malik.guest@example.test", phone: "9100000103" },
  { firstName: "Sana", lastName: "Reddy", email: "sana.reddy.guest@example.test", phone: "9100000104" },
  { firstName: "Kabir", lastName: "Sen", email: "kabir.sen.guest@example.test", phone: "9100000105" },
  { firstName: "Ira", lastName: "Kulkarni", email: "ira.kulkarni.guest@example.test", phone: "9100000106" },
  { firstName: "Neil", lastName: "Fernandes", email: "neil.fernandes.guest@example.test", phone: "9100000107" },
  { firstName: "Tara", lastName: "Bose", email: "tara.bose.guest@example.test", phone: "9100000108" },
  { firstName: "Aditya", lastName: "Nair", email: "aditya.nair.guest@example.test", phone: "9100000109" },
  { firstName: "Anika", lastName: "Kapoor", email: "anika.kapoor.guest@example.test", phone: "9100000110" },
  { firstName: "Dev", lastName: "Iyer", email: "dev.iyer.guest@example.test", phone: "9100000111" },
  { firstName: "Meera", lastName: "Pillai", email: "meera.pillai.guest@example.test", phone: "9100000112" },
  { firstName: "Arjun", lastName: "Roy", email: "arjun.roy.guest@example.test", phone: "9100000113" },
  { firstName: "Naina", lastName: "Joshi", email: "naina.joshi.guest@example.test", phone: "9100000114" },
  { firstName: "Kunal", lastName: "Bhat", email: "kunal.bhat.guest@example.test", phone: "9100000115" },
  { firstName: "Riya", lastName: "Menon", email: "riya.menon.guest@example.test", phone: "9100000116" },
  { firstName: "Ishaan", lastName: "Verma", email: "ishaan.verma.guest@example.test", phone: "9100000117" },
  { firstName: "Pia", lastName: "Chopra", email: "pia.chopra.guest@example.test", phone: "9100000118" },
  { firstName: "Rehan", lastName: "Qureshi", email: "rehan.qureshi.guest@example.test", phone: "9100000119" },
  { firstName: "Leela", lastName: "Fernandes", email: "leela.fernandes.guest@example.test", phone: "9100000120" },
];

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed (${response.status}): ${body?.message || response.statusText}`);
  }
  return body?.data === undefined ? body : body.data;
}

function hotelIdOf(hotel) {
  return hotel.slug || hotel._id || hotel.id;
}

function departmentIdOf(department) {
  return department._id || department.id;
}

function roomIdOf(room) {
  return room._id || room.id;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function isExpiredAccessToken(token) {
  const payload = token.split(".")[1];
  if (!payload) return false;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isFinite(claims.exp) && claims.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

function dateAfterDays(days) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const authToken = process.env.SEED_AUTH_TOKEN;
  if (!isDryRun && !authToken) {
    throw new Error("SEED_AUTH_TOKEN is required to list existing reservations before writing seed data.");
  }
  if (authToken && isExpiredAccessToken(authToken)) {
    throw new Error("SEED_AUTH_TOKEN has expired. Sign in again and set the new access token; access tokens expire after 15 minutes.");
  }

  const [hotelRows, existingRooms, existingDepartments, existingEmployees, bookingsResponse] = await Promise.all([
    request("/hotels?includeInactive=true"),
    request("/rooms?includeInactive=true"),
    request("/departments"),
    request("/employees"),
    isDryRun
      ? Promise.resolve({ bookings: [] })
      : request("/bookings/admin", { headers: { Authorization: `Bearer ${authToken}` } }),
  ]);
  if (!Array.isArray(hotelRows) || !Array.isArray(existingRooms) || !Array.isArray(existingDepartments) || !Array.isArray(existingEmployees)) {
    throw new Error("The hotel, room, department, or employee API returned an unexpected response.");
  }
  if (!bookingsResponse || !Array.isArray(bookingsResponse.bookings)) {
    throw new Error("The booking API returned an unexpected admin bookings response.");
  }

  if (isDryRun) {
    const activeSlugs = new Set(hotelRows.filter((hotel) => hotel.isActive !== false).map((hotel) => normalize(hotel.slug)));
    const targetHotelCount = new Set([
      ...hotelRows.filter((hotel) => hotel.isActive !== false).map(hotelIdOf),
      ...hotelDefinitions.map((hotel) => hotel.slug),
    ]).size;
    const missingHotels = hotelDefinitions.filter((hotel) => !activeSlugs.has(normalize(hotel.slug))).length;
    console.log(`Would create or reactivate ${missingHotels} of ${hotelDefinitions.length} seeded hotels.`);
    console.log(`Would ensure room types, ${departmentDefinitions.length} departments per hotel, and up to ${employeeDefinitions.length} employees across ${targetHotelCount} hotels.`);
    console.log(`Would ensure ${reservationGuests.length} reservations and matching payments.`);
    console.log(`Existing rooms: ${existingRooms.length}.`);
    console.log(`Existing departments: ${existingDepartments.length}.`);
    console.log(`Existing employees: ${existingEmployees.length}.`);
    console.log(`API: ${API_BASE_URL}`);
    return;
  }

  const hotelsBySlug = new Map(hotelRows.map((hotel) => [normalize(hotel.slug), hotel]));
  const seededHotels = [];
  let hotelsCreated = 0;
  let hotelsReactivated = 0;

  for (const definition of hotelDefinitions) {
    let hotel = hotelsBySlug.get(normalize(definition.slug));
    if (!hotel) {
      hotel = await request("/hotels", {
        method: "POST",
        body: JSON.stringify({ ...definition, isActive: true }),
      });
      hotelsCreated++;
    } else if (hotel.isActive === false) {
      hotel = await request(`/hotels/${encodeURIComponent(definition.slug)}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: true }),
      });
      hotelsReactivated++;
    }

    if (!hotelIdOf(hotel)) throw new Error(`Hotel "${definition.name}" was created without an ID or slug.`);
    seededHotels.push(hotel);
  }

  const hotelsById = new Map();
  for (const hotel of hotelRows.filter((item) => item.isActive !== false)) {
    const hotelId = hotelIdOf(hotel);
    if (hotelId) hotelsById.set(String(hotelId), hotel);
  }
  for (const hotel of seededHotels) {
    if (hotel.isActive !== false) hotelsById.set(String(hotelIdOf(hotel)), hotel);
  }
  const activeHotels = [...hotelsById.values()];

  let roomsCreated = 0;
  let roomsReactivated = 0;

  for (const hotel of activeHotels) {
    const hotelId = hotelIdOf(hotel);
    if (!hotelId) throw new Error(`Hotel "${hotel.name || "unnamed"}" has no slug or ID.`);
    const hotelIds = new Set([hotelId, hotel.slug, hotel._id, hotel.id].filter(Boolean).map(String));
    const roomDefinitions = roomDefinitionsByHotel[hotel.slug] || [
      {
        name: "Standard King Room",
        description: `Comfortable standard accommodation at ${hotel.name}.`,
        price: Number(hotel.basePrice) || 5000,
        capacity: 2,
        totalInventory: 5,
        bedType: "King Bed",
        roomSize: "350 sq.ft",
        amenities: ["Free Wi-Fi", "Air Conditioning", "Private Bathroom"],
      },
      {
        name: "Deluxe Family Suite",
        description: `Spacious family accommodation at ${hotel.name}.`,
        price: Math.round((Number(hotel.basePrice) || 5000) * 1.5),
        capacity: 4,
        totalInventory: 3,
        bedType: "King Bed + Twin Beds",
        roomSize: "600 sq.ft",
        amenities: ["Free Wi-Fi", "Air Conditioning", "Family Lounge"],
      },
    ];

    for (const definition of roomDefinitions) {
      let room = existingRooms.find((item) =>
        hotelIds.has(String(item.hotelId)) && normalize(item.name) === normalize(definition.name),
      );
      if (!room) {
        room = await request("/rooms", {
          method: "POST",
          body: JSON.stringify({ ...definition, hotelId, isActive: true }),
        });
        roomsCreated++;
      } else if (room.isActive === false) {
        room = await request(`/rooms/${encodeURIComponent(roomIdOf(room))}`, {
          method: "PATCH",
          body: JSON.stringify({ isActive: true }),
        });
        roomsReactivated++;
      }

      if (!roomIdOf(room)) throw new Error(`Room "${definition.name}" was created without an ID.`);
      existingRooms.push(room);
    }
  }

  if (activeHotels.length === 0) {
    throw new Error("No active hotels are available after seeding the hotel catalog.");
  }

  const departmentsByHotelAndName = new Map();
  let departmentsCreated = 0;
  let departmentsReactivated = 0;

  for (const hotel of activeHotels) {
    const hotelId = hotelIdOf(hotel);
    if (!hotelId) throw new Error(`Hotel "${hotel.name || "unnamed"}" has no slug or ID.`);
    const hotelIds = new Set([hotelId, hotel._id, hotel.id].filter(Boolean).map(String));

    for (const definition of departmentDefinitions) {
      let department = existingDepartments.find((item) =>
        hotelIds.has(String(item.hotelId)) && normalize(item.name) === normalize(definition.name),
      );

      if (!department) {
        department = await request("/departments", {
          method: "POST",
          body: JSON.stringify({
            name: definition.name,
            hotelId,
            description: definition.description,
            isActive: true,
          }),
        });
        departmentsCreated++;
      } else if (department.isActive === false) {
        department = await request(`/departments/${encodeURIComponent(departmentIdOf(department))}`, {
          method: "PATCH",
          body: JSON.stringify({ isActive: true }),
        });
        departmentsReactivated++;
      }

      const departmentId = departmentIdOf(department);
      if (!departmentId) throw new Error(`Department "${definition.name}" was created without an ID.`);
      departmentsByHotelAndName.set(`${hotelId}:${normalize(definition.name)}`, {
        ...department,
        id: departmentId,
        hotelId,
        definition,
      });
    }
  }

  const existingEmails = new Set(existingEmployees.map((employee) => normalize(employee.email)));
  const employeesByEmail = new Map(
    existingEmployees.map((employee) => [normalize(employee.email), employee]),
  );
  const departmentHeads = new Map();
  let employeesCreated = 0;
  let skippedEmployees = 0;

  for (const [index, definition] of employeeDefinitions.entries()) {
    const hotel = activeHotels[index % activeHotels.length];
    const hotelId = hotelIdOf(hotel);
    const department = departmentsByHotelAndName.get(`${hotelId}:${normalize(definition.department)}`);
    if (!department) throw new Error(`Missing ${definition.department} department for hotel "${hotel.name}".`);

    let employee = employeesByEmail.get(normalize(definition.email));
    if (existingEmails.has(normalize(definition.email))) {
      skippedEmployees++;
    } else {
      employee = await request("/employees", {
        method: "POST",
        body: JSON.stringify({
          hotelId,
          hotelName: hotel.name,
          departmentId: department.id,
          name: definition.name,
          email: definition.email,
          phone: definition.phone,
          position: definition.position,
          joiningDate: "2025-01-15",
          salary: definition.salary,
          role: definition.role,
        }),
      });
      employeesCreated++;
      existingEmails.add(normalize(definition.email));
      employeesByEmail.set(normalize(definition.email), employee);
    }

    const departmentKey = `${hotelId}:${normalize(definition.department)}`;
    const employeeHotelId = employee?.hotelId || employee?.department?.hotelId;
    const assignedToDepartment = String(employee?.departmentId || "") === String(department.id);
    const assignedToHotel = employeeHotelId && new Set([hotelId, hotel._id, hotel.id].filter(Boolean).map(String)).has(String(employeeHotelId));
    if (employee?.id && assignedToDepartment && assignedToHotel && !departmentHeads.has(departmentKey)) {
      departmentHeads.set(departmentKey, { department, employee });
    }
  }

  let departmentHeadsLinked = 0;
  for (const assignment of departmentHeads.values()) {
    if (assignment.department.headId) continue;
    await request(`/departments/${encodeURIComponent(assignment.department.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ headId: assignment.employee.id }),
    });
    departmentHeadsLinked++;
  }

  const existingBookings = bookingsResponse.bookings;
  let reservationsCreated = 0;
  let reservationsAlreadyPresent = 0;
  let paymentsCreated = 0;
  let paymentsAlreadyPresent = 0;
  let paymentsSkipped = 0;

  for (const [index, guest] of reservationGuests.entries()) {
    const hotel = activeHotels[index % activeHotels.length];
    const hotelId = hotelIdOf(hotel);
    const hotelIds = new Set([hotelId, hotel.slug, hotel._id, hotel.id].filter(Boolean).map(String));
    const hotelRooms = existingRooms.filter((room) =>
      room.isActive !== false && hotelIds.has(String(room.hotelId)),
    );
    if (hotelRooms.length === 0) {
      throw new Error(`No active room types are available for hotel "${hotel.name}".`);
    }

    const room = hotelRooms[index % hotelRooms.length];
    const roomId = roomIdOf(room);
    if (!roomId) throw new Error(`Room "${room.name}" at "${hotel.name}" has no ID.`);

    const marker = `StayEase seed reservation ${String(index + 1).padStart(2, "0")}`;
    let booking = existingBookings.find((item) =>
      item.special_requests === marker,
    );

    if (!booking) {
      const checkInDate = dateAfterDays(30 + index * 2);
      const checkOutDate = dateAfterDays(31 + index * 2);
      const holdResponse = await request("/bookings/hold", {
        method: "POST",
        body: JSON.stringify({
          hotel_id: hotelId,
          hotel_name: hotel.name,
          room_type_id: String(roomId),
          room_type_name: room.name,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          guests_count: Math.max(1, Math.min(2, Number(room.capacity) || 1)),
          room_count: 1,
          room_price_per_night: Number(room.price),
          taxes_and_fees: 0,
          guest_first_name: guest.firstName,
          guest_last_name: guest.lastName,
          guest_email: guest.email,
          guest_phone: guest.phone,
          special_requests: marker,
        }),
      });
      booking = holdResponse?.booking;
      if (!booking?.id || !booking.booking_code || !Number.isFinite(Number(booking.total_price))) {
        throw new Error(`Booking API returned an invalid reservation for ${guest.email}.`);
      }
      existingBookings.push(booking);
      reservationsCreated++;
    } else {
      reservationsAlreadyPresent++;
    }
    if (!booking?.id || !booking.booking_code) {
      throw new Error(`The existing reservation for ${guest.email} is missing its ID or booking code.`);
    }

    let payment = await request(`/payments/booking/${encodeURIComponent(booking.id)}`);
    if (["CANCELLED", "CHECKED_IN", "CHECKED_OUT"].includes(booking.status)) {
      if (payment?.status === "SUCCESS") {
        paymentsAlreadyPresent++;
        continue;
      }
      paymentsSkipped++;
      console.warn(`Skipping payment for ${booking.booking_code} because its reservation is ${booking.status}.`);
      continue;
    }
    if (!payment) {
      if (!(Number(booking.total_price) > 0)) {
        throw new Error(`Reservation ${booking.booking_code} has no positive total for payment.`);
      }
      const intent = await request("/payments/intent", {
        method: "POST",
        body: JSON.stringify({
          bookingId: booking.id,
          bookingCode: booking.booking_code,
          amount: Number(booking.total_price),
          currency: "INR",
          paymentMethod: "Seed test card",
        }),
      });
      if (!intent?.paymentId) {
        throw new Error(`Payment API did not return a payment ID for reservation ${booking.booking_code}.`);
      }
      payment = { id: intent.paymentId, status: "PENDING" };
      paymentsCreated++;
    } else {
      paymentsAlreadyPresent++;
    }

    if (payment.status === "PENDING") {
      const checkInDate = String(booking.check_in_date).slice(0, 10);
      const checkOutDate = String(booking.check_out_date).slice(0, 10);
      await request("/payments/confirm", {
        method: "POST",
        body: JSON.stringify({
          paymentId: payment.id,
          paymentMethod: "Seed test card",
          hotelName: booking.hotel_name,
          roomTypeName: booking.room_type_name,
          guestName: `${booking.guest_first_name} ${booking.guest_last_name}`.trim(),
          guestEmail: booking.guest_email,
          guestPhone: booking.guest_phone,
          checkInDate,
          checkOutDate,
          totalNights: Number(booking.total_nights),
          roomCount: Number(booking.room_count),
          subtotal: Number(booking.room_price_per_night) * Number(booking.total_nights) * Number(booking.room_count),
          taxesAndFees: Number(booking.taxes_and_fees),
          totalAmount: Number(booking.total_price),
        }),
      });
    } else if (payment.status !== "SUCCESS") {
      throw new Error(`Payment for reservation ${booking.booking_code} has unexpected status "${payment.status}".`);
    }
  }

  console.log(`Hotels created: ${hotelsCreated}`);
  console.log(`Hotels reactivated: ${hotelsReactivated}`);
  console.log(`Hotels used: ${activeHotels.length}`);
  console.log(`Room types created: ${roomsCreated}`);
  console.log(`Room types reactivated: ${roomsReactivated}`);
  console.log(`Departments created: ${departmentsCreated}`);
  console.log(`Departments reactivated: ${departmentsReactivated}`);
  console.log(`Employees created: ${employeesCreated}`);
  console.log(`Employees already present: ${skippedEmployees}`);
  console.log(`Department heads linked: ${departmentHeadsLinked}`);
  console.log(`Reservations created: ${reservationsCreated}`);
  console.log(`Reservations already present: ${reservationsAlreadyPresent}`);
  console.log(`Payments created: ${paymentsCreated}`);
  console.log(`Payments already present: ${paymentsAlreadyPresent}`);
  console.log(`Payments skipped: ${paymentsSkipped}`);
}

main().catch((error) => {
  console.error(`[Seed hotel operations] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
