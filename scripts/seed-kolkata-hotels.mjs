/**
 * Seed script for Kolkata Hotels & Rooms
 * Adds iconic Kolkata luxury & heritage hotels with high-resolution imagery and rooms
 */

const HOTEL_SERVICE_URL = process.env.HOTEL_SERVICE_URL || "http://localhost:8003/api/v1";
const ROOM_SERVICE_URL = process.env.ROOM_SERVICE_URL || "http://localhost:8004/api/v1";

const KOLKATA_HOTELS = [
  {
    slug: "oberoi-grand-kolkata",
    name: "The Oberoi Grand, Kolkata",
    city: "Kolkata",
    location: "15 Jawaharlal Nehru Road, New Market, Kolkata, West Bengal",
    mainImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 14500,
    rating: 4.9,
    reviewsCount: 420,
    tag: "The Grande Dame of Chowringhee",
    offer: "Colonial high tea & heritage tour included",
    category: "Heritage stays",
    description: "Affectionately known as 'The Grande Dame of Chowringhee', The Oberoi Grand combines classic Victorian architecture with lush palm-fringed courtyards, Thai spa rituals, and grand ballrooms in central Kolkata.",
    amenities: ["Swimming Pool", "Spa & Wellness", "Baan Thai Restaurant", "Heritage Courtyard", "Free Wi-Fi", "Fitness Center"],
    isActive: true,
  },
  {
    slug: "taj-bengal-kolkata",
    name: "Taj Bengal, Kolkata",
    city: "Kolkata",
    location: "34B, Belvedere Road, Alipore, Kolkata, West Bengal",
    mainImage: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 11000,
    rating: 4.8,
    reviewsCount: 380,
    tag: "Luxury in historic Alipore",
    offer: "10% off on 2+ nights stay",
    category: "Boutique hotels",
    description: "Designed by legendary architect Bob Fox, Taj Bengal is a landmark in leafy Alipore featuring a stunning six-storey atrium filled with natural light, modern Indian art, and award-winning dining.",
    amenities: ["Atrium Lounge", "Outdoor Pool", "Jiva Spa", "Sonargaon Dining", "Free Wi-Fi"],
    isActive: true,
  },
  {
    slug: "itc-royal-bengal",
    name: "ITC Royal Bengal, Kolkata",
    city: "Kolkata",
    location: "1 JBS Haldane Avenue, EM Bypass, Kolkata, West Bengal",
    mainImage: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 12000,
    rating: 4.9,
    reviewsCount: 490,
    tag: "Palatial tribute to Bengal's heritage",
    offer: "Complimentary breakfast at Grand Market Pavilion",
    category: "City hotels",
    description: "A monumental neoclassical palace honoring Bengal's intellectual and cultural Renaissance, boasting regal suites, private plunge pools, and 456 palatial rooms.",
    amenities: ["Palatial Architecture", "Kaya Kalp Spa", "Rooftop Pool", "Fine Dining", "Free Wi-Fi"],
    isActive: true,
  },
  {
    slug: "itc-sonar-kolkata",
    name: "ITC Sonar, Kolkata",
    city: "Kolkata",
    location: "1 JBS Haldane Avenue, EM Bypass, Kolkata, West Bengal",
    mainImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 9800,
    rating: 4.8,
    reviewsCount: 360,
    tag: "Bagan-bari inspired resort",
    offer: "15% dining credit on signature restaurants",
    category: "Boutique hotels",
    description: "A tranquil sanctuary modeled on the aristocratic garden homes (bagan-bari) of Bengal, set among water lily ponds, sprawling greens, and gourmet dining at Dum Pukht and Peshawri.",
    amenities: ["Lily Ponds", "Swimming Pool", "Dum Pukht Dining", "Kaya Kalp Spa", "Free Wi-Fi"],
    isActive: true,
  },
  {
    slug: "the-lalit-great-eastern",
    name: "The Lalit Great Eastern Kolkata",
    city: "Kolkata",
    location: "1, 2, 3 Old Court House Street, Dalhousie Square, Kolkata, West Bengal",
    mainImage: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 8500,
    rating: 4.7,
    reviewsCount: 290,
    tag: "Asia's first luxury hotel (estd. 1840)",
    offer: "Free bakery tasting at Maxim's",
    category: "Heritage stays",
    description: "Operating since 1840 as the premier luxury hotel in Asia, blending Victorian, Edwardian, and Contemporary wings with historic bakery and royal heritage.",
    amenities: ["Heritage Bakery", "Outdoor Pool", "Rejuve Spa", "Historic Courtyard", "Free Wi-Fi"],
    isActive: true,
  },
  {
    slug: "hyatt-regency-kolkata",
    name: "Hyatt Regency Kolkata",
    city: "Kolkata",
    location: "JA-1, Sector III, Salt Lake City, Kolkata, West Bengal",
    mainImage: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 7500,
    rating: 4.7,
    reviewsCount: 310,
    tag: "Urban oasis in Salt Lake",
    offer: "Complimentary breakfast & airport pickup",
    category: "City hotels",
    description: "An expansive 5-star business resort in Salt Lake City spread across six acres with resort-style swimming pool, tennis courts, and Italian fine dining at La Cucina.",
    amenities: ["Landscape Pool", "Tennis Courts", "Club Prana Spa", "La Cucina Restaurant", "Free Wi-Fi"],
    isActive: true,
  },
  {
    slug: "jw-marriot",
    name: "JW Marriott Hotel Kolkata",
    city: "Kolkata",
    location: "4A, J.B.S. Haldane Avenue, Topsia, Kolkata, West Bengal",
    mainImage: "https://res.cloudinary.com/wnc9d18t/image/upload/v1794739565/stayease/hotels/zvgkthqfcus25bfvdgsu.jpg",
    galleryImages: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 8000,
    rating: 4.8,
    reviewsCount: 340,
    tag: "Contemporary luxury in the City of Joy",
    offer: "10% off with breakfast buffet",
    category: "City hotels",
    description: "A stylish 5-star destination overlooking the Kolkata skyline with infinity pool, spa by JW, and award-winning international dining.",
    amenities: ["Infinity Pool", "Spa by JW", "JW Kitchen", "Executive Lounge", "Fitness Center", "Free Wi-Fi"],
    isActive: true,
  },
];

const KOLKATA_ROOMS = [
  // The Oberoi Grand, Kolkata
  {
    hotelId: "oberoi-grand-kolkata",
    name: "Luxury Heritage Room",
    description: "Classic colonial room with high ceilings, four-poster bed, teak furnishings, and courtyard view.",
    price: 14500,
    capacity: 2,
    totalInventory: 6,
    bedType: "King Bed",
    roomSize: "440 sq.ft",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Courtyard View", "High Ceilings", "Free Wi-Fi", "Marble Bathroom", "Rain Shower"],
    isActive: true,
  },
  {
    hotelId: "oberoi-grand-kolkata",
    name: "Premier Pool View Room",
    description: "Overlooks the lush palm courtyard and tranquil pool, featuring hand-woven carpets and personal butler service.",
    price: 19000,
    capacity: 2,
    totalInventory: 4,
    bedType: "King Bed",
    roomSize: "480 sq.ft",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Pool View", "Butler Service", "Free Wi-Fi", "Deep Soaking Tub", "Fruit Platter"],
    isActive: true,
  },

  // Taj Bengal, Kolkata
  {
    hotelId: "taj-bengal-kolkata",
    name: "Luxury Room (City View)",
    description: "Elegantly appointed room offering vistas of the city skyline or Belvedere lawns, enriched with Indian art.",
    price: 11000,
    capacity: 2,
    totalInventory: 8,
    bedType: "King Bed",
    roomSize: "410 sq.ft",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
    amenities: ["City View", "Free Wi-Fi", "Ergonomic Desk", "Forest Essentials Toiletries"],
    isActive: true,
  },
  {
    hotelId: "taj-bengal-kolkata",
    name: "Taj Club Room",
    description: "Complimentary access to the Taj Club Lounge with evening cocktails, Victoria Memorial view, and butler service.",
    price: 16500,
    capacity: 2,
    totalInventory: 5,
    bedType: "King Bed",
    roomSize: "450 sq.ft",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Taj Club Lounge", "Victoria Memorial View", "Butler Service", "Free Wi-Fi", "Evening High Tea"],
    isActive: true,
  },

  // ITC Royal Bengal, Kolkata
  {
    hotelId: "itc-royal-bengal",
    name: "Grand Presidential Room",
    description: "Palatial neoclassical suite with hand-carved pillars, panoramic EM Bypass views, and royal amenities.",
    price: 12000,
    capacity: 2,
    totalInventory: 8,
    bedType: "King Bed",
    roomSize: "550 sq.ft",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    amenities: ["City Skyline View", "Kaya Kalp Amenities", "Free Wi-Fi", "Separate Bathtub", "Smart TV"],
    isActive: true,
  },
  {
    hotelId: "itc-royal-bengal",
    name: "Towers Club Suite",
    description: "Expansive luxury suite with separate living room, executive desk, and exclusive Towers Club lounge access.",
    price: 24000,
    capacity: 3,
    totalInventory: 3,
    bedType: "King Bed + Sofa Bed",
    roomSize: "850 sq.ft",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Towers Lounge Access", "Cocktails Included", "Separate Living Room", "Walk-in Closet", "Free Wi-Fi"],
    isActive: true,
  },

  // ITC Sonar, Kolkata
  {
    hotelId: "itc-sonar-kolkata",
    name: "Executive Water Lily Pavilion",
    description: "Serene garden pavilion overlooking gentle water lily ponds, natural stone paths, and whispering trees.",
    price: 9800,
    capacity: 2,
    totalInventory: 7,
    bedType: "King Bed",
    roomSize: "430 sq.ft",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Water Lily Pond View", "Private Verandah", "Free Wi-Fi", "Rainfall Shower"],
    isActive: true,
  },

  // The Lalit Great Eastern Kolkata
  {
    hotelId: "the-lalit-great-eastern",
    name: "Heritage Victorian Room",
    description: "Restored room in the historic Victorian wing with antique brass fixtures, parquet flooring, and city views.",
    price: 8500,
    capacity: 2,
    totalInventory: 6,
    bedType: "King Bed",
    roomSize: "420 sq.ft",
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Heritage Decor", "Bakery Voucher Included", "Free Wi-Fi", "Classic Bathtub"],
    isActive: true,
  },

  // Hyatt Regency Kolkata
  {
    hotelId: "hyatt-regency-kolkata",
    name: "Regency King Room",
    description: "Bright, airy room with expansive garden and pool views, floor-to-ceiling windows, and Italian marble bath.",
    price: 7500,
    capacity: 2,
    totalInventory: 8,
    bedType: "King Bed",
    roomSize: "390 sq.ft",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Landscape Pool View", "Work Desk", "Free Wi-Fi", "Deep Soaking Tub"],
    isActive: true,
  },
];

async function seedKolkata() {
  console.log("Seeding Kolkata Hotels and Rooms...");

  const hotelsRes = await fetch(`${HOTEL_SERVICE_URL}/hotels?includeInactive=true`);
  const existingHotels = hotelsRes.ok ? await hotelsRes.json() : [];
  const hotelMapBySlug = new Map();
  for (const h of existingHotels) {
    if (h.slug) hotelMapBySlug.set(h.slug.toLowerCase(), h);
  }

  // Insert or update each Kolkata hotel
  for (const hotelData of KOLKATA_HOTELS) {
    const existing = hotelMapBySlug.get(hotelData.slug.toLowerCase());
    if (existing) {
      console.log(`Updating existing hotel: ${hotelData.name}`);
      const updateRes = await fetch(`${HOTEL_SERVICE_URL}/hotels/${existing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hotelData),
      });
      if (!updateRes.ok) console.error("Error updating hotel:", await updateRes.text());
    } else {
      console.log(`Creating new Kolkata hotel: ${hotelData.name}`);
      const createRes = await fetch(`${HOTEL_SERVICE_URL}/hotels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hotelData),
      });
      if (!createRes.ok) console.error("Error creating hotel:", await createRes.text());
    }
  }

  // Fetch rooms
  const roomsRes = await fetch(`${ROOM_SERVICE_URL}/rooms?includeInactive=true`);
  const existingRooms = roomsRes.ok ? await roomsRes.json() : [];
  const roomMapByKey = new Map();
  for (const r of existingRooms) {
    roomMapByKey.set(`${r.hotelId}::${r.name}`.toLowerCase(), r);
  }

  // Insert or update rooms
  for (const roomData of KOLKATA_ROOMS) {
    const key = `${roomData.hotelId}::${roomData.name}`.toLowerCase();
    const existing = roomMapByKey.get(key);
    if (existing) {
      await fetch(`${ROOM_SERVICE_URL}/rooms/${existing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomData),
      });
    } else {
      await fetch(`${ROOM_SERVICE_URL}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomData),
      });
    }
  }

  console.log("Kolkata hotels and rooms seed completed successfully!");
}

seedKolkata().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
