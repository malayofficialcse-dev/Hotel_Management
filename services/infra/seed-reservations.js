const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const servicesDir = path.resolve(__dirname, "..");
const userServiceDir = path.join(servicesDir, "user-service");
const hotelServiceDir = path.join(servicesDir, "operations-service");
const bookingServiceDir = path.join(servicesDir, "booking-service");

const dotenv = require(path.join(userServiceDir, "node_modules", "dotenv"));
const mongoose = require(path.join(hotelServiceDir, "node_modules", "mongoose"));
const { PrismaClient } = require(path.join(userServiceDir, "node_modules", "@prisma", "client"));

function readEnv(serviceDir) {
  const envPath = path.join(serviceDir, ".env");
  return fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
}

function resolveLocalUrl(value, label, expectedDatabase) {
  if (!value) {
    throw new Error(`${label} is not configured.`);
  }

  const parsed = new URL(value);
  const host = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
    throw new Error(`${label} must point to a local database; refusing to write to ${host}.`);
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, "").split("/")[0] || "");
  if (expectedDatabase && database !== expectedDatabase) {
    throw new Error(`${label} must target the local ${expectedDatabase} database.`);
  }

  return parsed.toString();
}

function dateAtUtcOffset(offset) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function makeBookingCode(hotelSlug, ordinal) {
  const hash = crypto.createHash("sha256").update(`${hotelSlug}:${ordinal}`).digest("hex");
  return `SE-${hash.slice(0, 10).toUpperCase()}`;
}

function makeDemoProfile(index) {
  const suffix = String(index + 1).padStart(3, "0");
  const bytes = crypto.createHash("sha256").update(`stayease-reservation-demo-${suffix}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");

  return {
    id: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`,
    name: `Demo Guest ${suffix}`,
    email: `reservation-demo-${suffix}@example.test`,
    phone: "0000000000",
  };
}

function normalizeProfile(profile) {
  const fullName = String(profile.name || "").trim();
  const [firstName, ...lastNameParts] = fullName.split(/\s+/);
  const lastName = lastNameParts.join(" ") || firstName;
  const email = String(profile.email || "").trim();
  const phone = String(profile.phone || "").trim();

  if (
    !profile.id ||
    !firstName ||
    !lastName ||
    firstName.length > 64 ||
    lastName.length > 64 ||
    email.length === 0 ||
    email.length > 128 ||
    phone.length === 0 ||
    phone.length > 32
  ) {
    return null;
  }

  return { id: String(profile.id), firstName, lastName, email, phone };
}

async function seedReservations() {
  const userEnv = readEnv(userServiceDir);
  const hotelEnv = readEnv(hotelServiceDir);
  const bookingEnv = readEnv(bookingServiceDir);
  const bookingUrl = resolveLocalUrl(
    process.env.BOOKING_DATABASE_URL || bookingEnv.DATABASE_URL || process.env.DATABASE_URL,
    "Booking database URL",
    "hotel_bookings_db",
  );
  const userUrl = resolveLocalUrl(
    process.env.USER_DATABASE_URL || userEnv.DATABASE_URL,
    "User database URL",
    "hotel_users_db",
  );
  let mongoUrl = process.env.MONGODB_URI || hotelEnv.MONGODB_URI || "mongodb://localhost:27017/hotel_catalog";
  const parsedMongoUrl = new URL(mongoUrl);
  const mongoHost = parsedMongoUrl.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!["localhost", "127.0.0.1", "::1"].includes(mongoHost)) {
    throw new Error(`MongoDB URI must point to a local database; refusing to read from ${mongoHost}.`);
  }
  if (!parsedMongoUrl.pathname || parsedMongoUrl.pathname === "/") {
    parsedMongoUrl.pathname = "/hotel_catalog";
  } else if (parsedMongoUrl.pathname.replace(/^\/+/, "").split("/")[0] !== "hotel_catalog") {
    throw new Error("MongoDB URI must target the local hotel_catalog database.");
  }
  mongoUrl = parsedMongoUrl.toString();

  const requestedPerHotel = Number(process.env.RESERVATIONS_PER_HOTEL || 10);
  if (!Number.isInteger(requestedPerHotel) || requestedPerHotel < 1 || requestedPerHotel > 100) {
    throw new Error("RESERVATIONS_PER_HOTEL must be an integer from 1 to 100.");
  }

  const usersDb = new PrismaClient({ datasources: { db: { url: userUrl } } });
  const bookingsDb = new PrismaClient({ datasources: { db: { url: bookingUrl } } });
  const catalog = mongoose.createConnection(mongoUrl);

  try {
    await Promise.all([usersDb.$connect(), bookingsDb.$connect(), catalog.asPromise()]);

    const tableCheck = await bookingsDb.$queryRawUnsafe(
      "SELECT to_regclass('public.bookings') IS NOT NULL AS exists",
    );
    if (!tableCheck[0].exists) {
      throw new Error("The bookings table is missing from hotel_bookings_db; initialize the booking service first.");
    }

    let profiles = await usersDb.$queryRawUnsafe(
      "SELECT id, name, email, phone FROM user_profiles ORDER BY id",
    );
    const hotels = await catalog.db.collection("hotels").find({ isActive: true }).sort({ slug: 1 }).toArray();
    if (hotels.length === 0) {
      throw new Error("No active hotels were found in hotel_catalog.");
    }

    const hotelSlugs = hotels.map((hotel) => hotel.slug).filter(Boolean);
    const rooms = await catalog
      .db.collection("rooms")
      .find({ hotelId: { $in: hotelSlugs }, isActive: true, totalInventory: { $gt: 0 } })
      .sort({ hotelId: 1, name: 1 })
      .toArray();
    const roomsByHotel = new Map();
    for (const room of rooms) {
      if (!roomsByHotel.has(room.hotelId)) roomsByHotel.set(room.hotelId, []);
      roomsByHotel.get(room.hotelId).push(room);
    }

    for (const hotel of hotels) {
      if (!hotel.slug || !hotel.name || !roomsByHotel.has(hotel.slug)) {
        throw new Error(`Active hotel ${hotel.name || hotel.slug || "(unknown)"} has no active room inventory.`);
      }
    }

    let demoProfilesCreated = 0;
    if (profiles.length === 0 && process.env.CREATE_DEMO_PROFILES === "true") {
      const demoProfiles = Array.from(
        { length: Math.min(requestedPerHotel, 10) },
        (_, index) => makeDemoProfile(index),
      );
      await usersDb.$transaction(async (tx) => {
        for (const profile of demoProfiles) {
          await tx.$executeRawUnsafe(
            `INSERT INTO user_profiles (id, name, email, phone, country, id_proof)
             VALUES ($1::uuid, $2, $3, $4, 'India', 'DEMO SEED')
             ON CONFLICT (id) DO NOTHING`,
            profile.id,
            profile.name,
            profile.email,
            profile.phone,
          );
        }
      });
      demoProfilesCreated = demoProfiles.length;
      profiles = await usersDb.$queryRawUnsafe(
        "SELECT id, name, email, phone FROM user_profiles ORDER BY id",
      );
    }

    const eligibleProfiles = profiles.map(normalizeProfile).filter(Boolean);
    if (eligibleProfiles.length === 0) {
      throw new Error(
        "No existing user profiles have valid names, email addresses, and phone numbers. Set CREATE_DEMO_PROFILES=true to create demo profiles.",
      );
    }

    const result = await bookingsDb.$transaction(
      async (tx) => {
        const totals = new Map(hotels.map((hotel) => [hotel.slug, { inserted: 0, skipped: 0 }]));
        let profileIndex = 0;

        for (const hotel of hotels) {
          const hotelRooms = roomsByHotel.get(hotel.slug);
          for (let ordinal = 1; ordinal <= requestedPerHotel; ordinal += 1) {
            const bookingCode = makeBookingCode(hotel.slug, ordinal);
            const existing = await tx.$queryRawUnsafe(
              "SELECT 1 FROM bookings WHERE booking_code = $1 LIMIT 1",
              bookingCode,
            );
            if (existing.length > 0) {
              totals.get(hotel.slug).skipped += 1;
              continue;
            }

            const profile = eligibleProfiles[profileIndex % eligibleProfiles.length];
            profileIndex += 1;
            const offsetStart = 30 + (ordinal - 1) * 2;
            let reservation = null;

            for (let offset = offsetStart; offset < 395 && !reservation; offset += 1) {
              const checkIn = dateAtUtcOffset(offset);
              const checkOut = dateAtUtcOffset(offset + 1);
              const rotatedRooms = hotelRooms.slice((ordinal - 1) % hotelRooms.length)
                .concat(hotelRooms.slice(0, (ordinal - 1) % hotelRooms.length));

              for (const room of rotatedRooms) {
                const roomTypeId = String(room._id);
                await tx.$queryRawUnsafe(
                  "SELECT 1 FROM pg_advisory_xact_lock(hashtextextended($1, 0))",
                  roomTypeId,
                );
                const counts = await tx.$queryRawUnsafe(
                  `SELECT COALESCE(SUM(room_count), 0)::int AS booked
                   FROM bookings
                   WHERE room_type_id = $1
                     AND check_in_date < $3::date
                     AND check_out_date > $2::date
                     AND (status IN ('CONFIRMED', 'CHECKED_IN')
                          OR (status = 'PENDING_PAYMENT' AND expires_at > NOW()))`,
                  roomTypeId,
                  checkIn,
                  checkOut,
                );
                if (Number(counts[0].booked) < Number(room.totalInventory)) {
                  reservation = { room, roomTypeId, checkIn, checkOut };
                  break;
                }
              }
            }

            if (!reservation) {
              throw new Error(`Could not find available inventory for ${hotel.name} booking ${ordinal}.`);
            }

            const price = Number(reservation.room.price);
            const taxes = Math.round(price * 0.12 * 100) / 100;
            const guestCount = Math.min(2, Number(reservation.room.capacity));
            const inserted = await tx.$queryRawUnsafe(
              `INSERT INTO bookings (
                 id, booking_code, user_id, hotel_id, hotel_name, room_type_id, room_type_name,
                 check_in_date, check_out_date, total_nights, guests_count, room_count,
                 room_price_per_night, taxes_and_fees, total_price, status,
                 guest_first_name, guest_last_name, guest_email, guest_phone,
                 special_requests, expires_at, created_at, updated_at
               ) VALUES (
                 $1::uuid, $2, $3::uuid, $4, $5, $6, $7,
                 $8::date, $9::date, 1, $10, 1,
                 $11, $12, $13, 'CONFIRMED',
                 $14, $15, $16, $17,
                 'Demo seed reservation', NOW(), NOW(), NOW()
               )
               ON CONFLICT (booking_code) DO NOTHING
               RETURNING id`,
              crypto.randomUUID(),
              bookingCode,
              profile.id,
              hotel.slug,
              hotel.name,
              reservation.roomTypeId,
              reservation.room.name,
              reservation.checkIn,
              reservation.checkOut,
              guestCount,
              price,
              taxes,
              price + taxes,
              profile.firstName,
              profile.lastName,
              profile.email,
              profile.phone,
            );

            if (inserted.length > 0) totals.get(hotel.slug).inserted += 1;
            else totals.get(hotel.slug).skipped += 1;
          }
        }

        return totals;
      },
      { maxWait: 10000, timeout: 120000 },
    );

    let insertedTotal = 0;
    let skippedTotal = 0;
    for (const hotel of hotels) {
      const counts = result.get(hotel.slug);
      insertedTotal += counts.inserted;
      skippedTotal += counts.skipped;
      console.log(`${hotel.name}: inserted ${counts.inserted}, already present ${counts.skipped}`);
    }
    console.log(
      `Reservation seed complete: ${insertedTotal} inserted, ${skippedTotal} already present across ${hotels.length} active hotels.`,
    );
    if (demoProfilesCreated > 0) {
      console.log(`Created ${demoProfilesCreated} clearly labeled demo user profiles.`);
    }
  } finally {
    await Promise.allSettled([usersDb.$disconnect(), bookingsDb.$disconnect(), catalog.close()]);
  }
}

seedReservations().catch((error) => {
  console.error(`Reservation seed failed: ${error.message}`);
  process.exitCode = 1;
});
