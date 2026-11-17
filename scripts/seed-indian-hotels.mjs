/**
 * Seed script for Indian Hotels and Rooms
 * Adds premium Indian hotels across iconic destinations and their rooms
 */

const HOTEL_SERVICE_URL = process.env.HOTEL_SERVICE_URL || "http://localhost:8003/api/v1";
const ROOM_SERVICE_URL = process.env.ROOM_SERVICE_URL || "http://localhost:8004/api/v1";

const INDIAN_HOTELS = [
  {
    slug: "palm-house",
    name: "The Palm House",
    city: "Goa",
    location: "Candolim Beach Road, North Goa",
    mainImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 8000,
    rating: 4.8,
    reviewsCount: 324,
    tag: "Your coastal escape",
    offer: "10% off your first stay",
    category: "Beach resorts",
    description: "Nestled among tranquil palm groves just minutes from Candolim Beach, The Palm House combines tropical serenity with boutique luxury.",
    amenities: ["Free Wi-Fi", "Infinity Pool", "Complimentary Breakfast", "Spa & Wellness", "Beach Access", "Bar & Lounge"],
    isActive: true,
  },
  {
    slug: "haveli",
    name: "Haveli & Co.",
    city: "Jaipur",
    location: "Civil Lines, Jaipur, Rajasthan",
    mainImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 6500,
    rating: 4.9,
    reviewsCount: 218,
    tag: "Heritage hideaway",
    offer: "Breakfast on us",
    category: "Heritage stays",
    description: "A meticulously restored 19th-century royal haveli showcasing Rajasthani architecture, handcrafted jharokhas, courtyards, and rooftop sunset dining.",
    amenities: ["Free Wi-Fi", "Swimming Pool", "Heritage Courtyard", "Rooftop Restaurant", "Cultural Evenings"],
    isActive: true,
  },
  {
    slug: "lakehouse",
    name: "Lakehouse Retreat",
    city: "Udaipur",
    location: "Lake Pichola, Udaipur, Rajasthan",
    mainImage: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 12400,
    rating: 4.9,
    reviewsCount: 186,
    tag: "Lakeside luxury",
    offer: "Save 15% on 3+ nights",
    category: "Boutique hotels",
    description: "Perched on the serene banks of Lake Pichola with breathtaking views of the City Palace, private boat transfers, and fine dining.",
    amenities: ["Lake View", "Infinity Pool", "Fine Dining", "Private Boat Transfer", "Butler Service"],
    isActive: true,
  },
  {
    slug: "taj-mahal-palace",
    name: "The Taj Mahal Palace",
    city: "Mumbai",
    location: "Apollo Bunder, Colaba, Mumbai, Maharashtra",
    mainImage: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 18500,
    rating: 4.9,
    reviewsCount: 540,
    tag: "Iconic heritage landmark",
    offer: "Heritage walk & high tea included",
    category: "Heritage stays",
    description: "India's premier grand hotel overlooking the Gateway of India and the Arabian Sea, blending Moorish, Oriental, and Florentine styles with legendary Indian hospitality.",
    amenities: ["Sea View", "Swimming Pool", "Spa & Wellness", "Fine Dining", "Butler Service", "Fitness Center", "Free Wi-Fi"],
    isActive: true,
  },
  {
    slug: "oberoi-udaivilas",
    name: "The Oberoi Udaivilas",
    city: "Udaipur",
    location: "Haridas Ji Ki Magri, Lake Pichola, Udaipur, Rajasthan",
    mainImage: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 26000,
    rating: 5.0,
    reviewsCount: 380,
    tag: "Royal Rajasthani grandeur",
    offer: "Save 15% on 3+ nights",
    category: "Boutique hotels",
    description: "Spread over 50 acres on the banks of Lake Pichola, The Oberoi Udaivilas stands on the 200-year-old hunting grounds of the Maharana of Mewar with interlocking domes, courtyards, and reflection pools.",
    amenities: ["Private Pool Access", "Lake View", "Luxury Spa", "Yoga Sessions", "Fine Dining", "Boat Excursions", "Free Wi-Fi"],
    isActive: true,
  },
  {
    slug: "itc-grand-chola",
    name: "ITC Grand Chola",
    city: "Chennai",
    location: "Anna Salai, Guindy, Chennai, Tamil Nadu",
    mainImage: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 9500,
    rating: 4.8,
    reviewsCount: 410,
    tag: "Chola architectural tribute",
    offer: "15% dining credit on all restaurants",
    category: "City hotels",
    description: "An architectural marvel inspired by the Imperial Cholas, featuring grand carved pillars, sweeping staircases, and 10 signature dining destinations.",
    amenities: ["Free Wi-Fi", "Swimming Pool", "Kaya Kalp Spa", "Multi-Cuisine Dining", "Helipad", "Fitness Center"],
    isActive: true,
  },
  {
    slug: "kumarakom-lake-resort",
    name: "Kumarakom Lake Resort",
    city: "Kumarakom",
    location: "North Post, Kumarakom, Kottayam, Kerala",
    mainImage: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 13500,
    rating: 4.9,
    reviewsCount: 295,
    tag: "Serene backwater paradise",
    offer: "Sunset backwater cruise included",
    category: "Beach resorts",
    description: "Set on the lush shores of Lake Vembanad in Kerala, with traditional 16th-century heritage homesteads, meandering pools, and Ayurvedic therapies.",
    amenities: ["Meandering Pool", "Ayurvedic Spa", "Houseboat Cruises", "Lake View Dining", "Fishing", "Free Wi-Fi"],
    isActive: true,
  },
  {
    slug: "evolve-back-coorg",
    name: "Evolve Back, Chikkana Halli Estate",
    city: "Coorg",
    location: "Karadigodu Post, Siddapur, Coorg, Karnataka",
    mainImage: "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 16000,
    rating: 4.9,
    reviewsCount: 310,
    tag: "Plantation life in coffee country",
    offer: "Coffee trail & tasting included",
    category: "Villas & retreats",
    description: "Enclosed by a 300-acre working coffee and spice plantation in Coorg, offering private pool villas and scented nature trails.",
    amenities: ["Private Pool", "Ayurvedic Spa", "Coffee Plantation Tour", "Bird Watching", "Reading Lounge", "Free Wi-Fi"],
    isActive: true,
  },
  {
    slug: "the-leela-palace-bengaluru",
    name: "The Leela Palace",
    city: "Bengaluru",
    location: "HAL Old Airport Road, Kodihalli, Bengaluru, Karnataka",
    mainImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 11500,
    rating: 4.8,
    reviewsCount: 460,
    tag: "Modern palace amidst gardens",
    offer: "10% off for weekend stays",
    category: "City hotels",
    description: "Standing majestically amidst nine acres of lush green gardens and a sparkling lagoon, inspired by the Royal Palace of Mysore.",
    amenities: ["Lagoon Pool", "Luxury Spa", "Pan-Asian Dining", "Business Center", "Valet Parking", "Free Wi-Fi"],
    isActive: true,
  },
  {
    slug: "wildflower-hall-shimla",
    name: "Wildflower Hall, An Oberoi Resort",
    city: "Shimla",
    location: "Chharabra, Shimla, Himachal Pradesh",
    mainImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 21000,
    rating: 4.9,
    reviewsCount: 275,
    tag: "Cedar forest mountain sanctuary",
    offer: "Complimentary cedar nature trail walk",
    category: "Villas & retreats",
    description: "Perched 8,250 feet above sea level in the Himalayas amidst 22 acres of protected cedar forest, formerly the home of Lord Kitchener.",
    amenities: ["Heated Outdoor Whirlpool", "Mountain View", "Spa Pavilions", "Nature Walks", "Fireplace Lounge", "Free Wi-Fi"],
    isActive: true,
  },
  {
    slug: "umaid-bhawan-palace",
    name: "Umaid Bhawan Palace",
    city: "Jodhpur",
    location: "Circuit House Road, Cantt Area, Jodhpur, Rajasthan",
    mainImage: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 24000,
    rating: 4.9,
    reviewsCount: 520,
    tag: "Living royal palace of Marwar",
    offer: "Royal arrival welcome & museum entry",
    category: "Heritage stays",
    description: "One of the world's largest private residences and home of the Jodhpur royal family, perched atop Chittar Hill with breathtaking vistas of the Blue City.",
    amenities: ["Palace Lawns", "Subterranean Pool", "Jiva Grande Spa", "Vintage Car Collection", "Bespoke Dining", "Free Wi-Fi"],
    isActive: true,
  },
  {
    slug: "monsoon-grove",
    name: "Monsoon Grove Retreat",
    city: "Munnar",
    location: "Pallivasal Tea Estate, Munnar, Kerala",
    mainImage: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1200",
    galleryImages: [
      "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ],
    basePrice: 8800,
    rating: 4.8,
    reviewsCount: 154,
    tag: "A hideaway in the hills",
    offer: "Save 12% on a 2-night stay",
    category: "Villas & retreats",
    description: "A tranquil sanctuary in the western ghats surrounded by rolling tea plantations, cool mountain breezes, and morning birdsong.",
    amenities: ["Free Wi-Fi", "Mountain View", "Breakfast Included", "Tea Garden Walks", "Campfire"],
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
  {
    slug: "brijrama-palace",
    name: "BrijRama Palace",
    city: "Varanasi",
    location: "Darbhanga Ghat, Dashashwamedh, Varanasi, Uttar Pradesh",
    mainImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80"
    ],
    basePrice: 19500,
    rating: 4.9,
    reviewsCount: 280,
    tag: "Heritage palace on the Holy Ganges",
    offer: "Private Bajra boat ride for Ganga Aarti",
    category: "Heritage stays",
    description: "One of the oldest landmarks on the sacred ghats of Varanasi, built in the 18th century as a palace for the Maharaja of Nagpur, offering spiritual luxury by the River Ganges.",
    amenities: ["River Ganges View", "Vegetarian Dining", "Traditional Music", "Ayurvedic Spa", "Ghat Access", "Free Wi-Fi"],
    isActive: true,
  },
];

const INDIAN_ROOMS = [
  // The Palm House (Goa)
  {
    hotelId: "palm-house",
    name: "Deluxe King Room",
    description: "Comfortable king accommodation with tropical pool views, private balcony, and rainfall shower.",
    price: 8000,
    capacity: 2,
    totalInventory: 8,
    bedType: "King Bed",
    roomSize: "380 sq.ft",
    image: "/assets/figma/a0108.png",
    amenities: ["Free Wi-Fi", "Pool View", "Mini Bar", "Air Conditioning", "Rain Shower"],
    isActive: true,
  },
  {
    hotelId: "palm-house",
    name: "Ocean View Villa",
    description: "Spacious private villa with a personal plunge pool, sundeck, and panoramic views of the Arabian Sea.",
    price: 14500,
    capacity: 4,
    totalInventory: 5,
    bedType: "2 King Beds",
    roomSize: "750 sq.ft",
    image: "/assets/figma/185bf.png",
    amenities: ["Private Plunge Pool", "Balcony", "Free Wi-Fi", "Espresso Machine", "Bathtub"],
    isActive: true,
  },
  {
    hotelId: "palm-house",
    name: "Sunset Beach Suite",
    description: "Direct beachfront suite with wraparound terrace, outdoor daybed, and butler service.",
    price: 18500,
    capacity: 3,
    totalInventory: 4,
    bedType: "King Bed + Daybed",
    roomSize: "620 sq.ft",
    image: "/assets/figma/b62b5.png",
    amenities: ["Beachfront View", "Butler Service", "Free Wi-Fi", "Mini Bar", "Sundeck"],
    isActive: true,
  },

  // Haveli & Co. (Jaipur)
  {
    hotelId: "haveli",
    name: "Heritage Royal Suite",
    description: "Authentic Rajasthani suite with antique brass four-poster bed, handcrafted jharokhas, and courtyard views.",
    price: 6500,
    capacity: 2,
    totalInventory: 6,
    bedType: "Four-Poster King",
    roomSize: "420 sq.ft",
    image: "/assets/figma/185bf.png",
    amenities: ["Courtyard View", "Handcrafted Decor", "Free Wi-Fi", "Bathtub", "Heritage Balcony"],
    isActive: true,
  },
  {
    hotelId: "haveli",
    name: "Courtyard Family Room",
    description: "Traditional family quarters overlooking the inner courtyard, ideal for small families exploring Jaipur.",
    price: 9200,
    capacity: 4,
    totalInventory: 5,
    bedType: "King Bed + Twin Beds",
    roomSize: "620 sq.ft",
    image: "/assets/figma/b62b5.png",
    amenities: ["Courtyard View", "Free Wi-Fi", "Breakfast Included", "Air Conditioning", "Lounge Seating"],
    isActive: true,
  },

  // Lakehouse Retreat (Udaipur)
  {
    hotelId: "lakehouse",
    name: "Lakefront Palace Room",
    description: "Exquisite room with private marble balcony directly framing Lake Pichola and the City Palace.",
    price: 12400,
    capacity: 2,
    totalInventory: 6,
    bedType: "King Bed",
    roomSize: "500 sq.ft",
    image: "/assets/figma/b62b5.png",
    amenities: ["Lake Pichola View", "Private Balcony", "Butler Service", "Free Wi-Fi", "Marble Bathtub"],
    isActive: true,
  },
  {
    hotelId: "lakehouse",
    name: "Royal Lake Suite",
    description: "Panoramic lakefront suite with ornate archways, separate parlor, and sunset dining table.",
    price: 18500,
    capacity: 4,
    totalInventory: 3,
    bedType: "King Bed + Sofa Bed",
    roomSize: "820 sq.ft",
    image: "/assets/figma/a0108.png",
    amenities: ["Panoramic Lake View", "Separate Lounge", "Butler Service", "Free Wi-Fi", "Espresso Bar"],
    isActive: true,
  },

  // The Taj Mahal Palace (Mumbai)
  {
    hotelId: "taj-mahal-palace",
    name: "Heritage Grand Room",
    description: "Historic room in the palace wing with views of the Gateway of India and the Arabian Sea.",
    price: 18500,
    capacity: 2,
    totalInventory: 6,
    bedType: "King Bed",
    roomSize: "450 sq.ft",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Arabian Sea View", "24-hr Butler", "Free Wi-Fi", "Italian Marble Bathroom", "Mini Bar"],
    isActive: true,
  },
  {
    hotelId: "taj-mahal-palace",
    name: "Luxury Sea View Suite",
    description: "Opulent suite with separate living salon, antique colonial chandeliers, and bespoke concierge.",
    price: 32000,
    capacity: 3,
    totalInventory: 3,
    bedType: "King Bed + Daybed",
    roomSize: "780 sq.ft",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Gateway View", "Executive Lounge Access", "High Tea Included", "Butler Service", "Jacuzzi"],
    isActive: true,
  },

  // The Oberoi Udaivilas (Udaipur)
  {
    hotelId: "oberoi-udaivilas",
    name: "Premier Room with Semi-Private Pool",
    description: "Opens directly onto a 73-meter moated swimming pool with serene lake and garden views.",
    price: 26000,
    capacity: 2,
    totalInventory: 6,
    bedType: "King Bed",
    roomSize: "600 sq.ft",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Direct Pool Access", "Private Sunken Bathtub", "Lake View", "Butler Service", "Free Wi-Fi"],
    isActive: true,
  },
  {
    hotelId: "oberoi-udaivilas",
    name: "Luxury Suite with Private Pool",
    description: "Magnificent suite featuring a private 8-meter outdoor pool, tented dining pavilion, and City Palace panoramas.",
    price: 52000,
    capacity: 4,
    totalInventory: 2,
    bedType: "King Bed + Extra Bed",
    roomSize: "1,150 sq.ft",
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Private Pool", "Dining Pavilion", "City Palace View", "24-hr Butler", "Fine Dining Included"],
    isActive: true,
  },

  // ITC Grand Chola (Chennai)
  {
    hotelId: "itc-grand-chola",
    name: "Executive Club Room",
    description: "Expansive modern business accommodation with ergonomic workstation, luxury bedding, and city view.",
    price: 9500,
    capacity: 2,
    totalInventory: 10,
    bedType: "King Bed",
    roomSize: "405 sq.ft",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    amenities: ["City View", "Free Wi-Fi", "Ergonomic Workstation", "Marble Shower", "4-Fixture Bath"],
    isActive: true,
  },
  {
    hotelId: "itc-grand-chola",
    name: "Chola Royal Suite",
    description: "Palatial multi-room suite with ornate carved stone, private boardroom table, and club privileges.",
    price: 22500,
    capacity: 3,
    totalInventory: 4,
    bedType: "King Bed",
    roomSize: "850 sq.ft",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Club Lounge Access", "Cocktail Hour Included", "Butler Service", "Walk-in Wardrobe", "Free Wi-Fi"],
    isActive: true,
  },

  // Kumarakom Lake Resort (Kerala)
  {
    hotelId: "kumarakom-lake-resort",
    name: "Heritage Meandering Pool Villa",
    description: "Traditional villa with open-to-sky shower and direct stepped entry into the resort's 250m pool.",
    price: 13500,
    capacity: 2,
    totalInventory: 7,
    bedType: "King Bed",
    roomSize: "550 sq.ft",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Direct Pool Access", "Open-air Shower", "Private Sit-out", "Free Wi-Fi", "Ayurvedic Toiletries"],
    isActive: true,
  },
  {
    hotelId: "kumarakom-lake-resort",
    name: "Presidential Lake Pool Villa",
    description: "Ultra-luxury lakefront villa with private infinity pool overlooking Lake Vembanad.",
    price: 28000,
    capacity: 4,
    totalInventory: 3,
    bedType: "2 King Beds",
    roomSize: "1,200 sq.ft",
    image: "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Private Infinity Pool", "Vembanad Lake View", "Sunset Cruise Included", "Personal Chef on Request"],
    isActive: true,
  },

  // Evolve Back Coorg
  {
    hotelId: "evolve-back-coorg",
    name: "Heritage Pool Villa",
    description: "Secluded plantation villa with courtyard, private plunge pool, and separate day lounge.",
    price: 16000,
    capacity: 2,
    totalInventory: 5,
    bedType: "King Bed",
    roomSize: "650 sq.ft",
    image: "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Private Plunge Pool", "Plantation View", "Plantation Tour Included", "Free Wi-Fi", "Espresso Maker"],
    isActive: true,
  },
  {
    hotelId: "evolve-back-coorg",
    name: "Lily Pool Cottage",
    description: "Charming cottage set around natural lily ponds with verandah and bedroom fireplace.",
    price: 14000,
    capacity: 2,
    totalInventory: 6,
    bedType: "Queen Bed",
    roomSize: "500 sq.ft",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Lily Pond View", "Fireplace", "Verandah", "Nature Trails", "Free Wi-Fi"],
    isActive: true,
  },

  // The Leela Palace Bengaluru
  {
    hotelId: "the-leela-palace-bengaluru",
    name: "Deluxe Palace Room",
    description: "Sumptuous palace room decorated with traditional Indian motifs, silks, and garden views.",
    price: 11500,
    capacity: 2,
    totalInventory: 8,
    bedType: "King Bed",
    roomSize: "550 sq.ft",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Garden View", "Free Wi-Fi", "Marble Bathroom with Tub", "Balcony", "Pillow Menu"],
    isActive: true,
  },
  {
    hotelId: "the-leela-palace-bengaluru",
    name: "Royal Premier Room",
    description: "Overlooks the cascading waterfalls and palm gardens, offering dedicated royal club concierge.",
    price: 15000,
    capacity: 2,
    totalInventory: 6,
    bedType: "King Bed",
    roomSize: "600 sq.ft",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Lagoon View", "Club Privileges", "Cocktail Hour Included", "24-hr Butler", "Free Wi-Fi"],
    isActive: true,
  },

  // Wildflower Hall Shimla
  {
    hotelId: "wildflower-hall-shimla",
    name: "Deluxe Garden View Room",
    description: "Warm teak flooring, hand-knotted rugs, and views of the landscaped gardens and virgin cedar forest.",
    price: 21000,
    capacity: 2,
    totalInventory: 6,
    bedType: "King Bed",
    roomSize: "450 sq.ft",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Cedar Forest View", "Fireplace Warmth", "Free Wi-Fi", "Walk-in Wardrobe", "Deep Soaking Tub"],
    isActive: true,
  },
  {
    hotelId: "wildflower-hall-shimla",
    name: "Premier Mountain View Room",
    description: "Floor-to-ceiling glass windows framing majestic snow-peaked Himalayan ranges.",
    price: 27500,
    capacity: 2,
    totalInventory: 4,
    bedType: "King Bed",
    roomSize: "500 sq.ft",
    image: "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Snow Peak Views", "Binoculars in Room", "Mountain Trail Included", "Heated Whirlpool Access"],
    isActive: true,
  },

  // Umaid Bhawan Palace Jodhpur
  {
    hotelId: "umaid-bhawan-palace",
    name: "Palace Room",
    description: "Art Deco royal quarters with rich wood accents, crystal chandeliers, and palace lawn views.",
    price: 24000,
    capacity: 2,
    totalInventory: 5,
    bedType: "King Bed",
    roomSize: "485 sq.ft",
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Palace Lawns View", "Royal Butler Service", "Free Wi-Fi", "Historic Decor", "Heritage Bath"],
    isActive: true,
  },
  {
    hotelId: "umaid-bhawan-palace",
    name: "Historical Suite",
    description: "Once hosted visiting royalty and dignitaries, featuring authentic Marwar regalia and private terrace.",
    price: 42000,
    capacity: 3,
    totalInventory: 3,
    bedType: "King Bed",
    roomSize: "800 sq.ft",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Blue City Panoramas", "Private Terrace", "Royal Dining", "Museum Access", "Butler Service"],
    isActive: true,
  },

  // Monsoon Grove Munnar
  {
    hotelId: "monsoon-grove",
    name: "Valley View Cottage",
    description: "Cozy timber cottage facing undulating tea gardens with fresh cardamom-scented morning air.",
    price: 8800,
    capacity: 2,
    totalInventory: 6,
    bedType: "King Bed",
    roomSize: "420 sq.ft",
    image: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1200",
    amenities: ["Tea Garden View", "Private Balcony", "Free Wi-Fi", "Breakfast Included", "Campfire Access"],
    isActive: true,
  },
  {
    hotelId: "monsoon-grove",
    name: "Hillside Family Suite",
    description: "Two-bedroom hill sanctuary with large glass viewing deck and private tea plantation trail access.",
    price: 13500,
    capacity: 4,
    totalInventory: 4,
    bedType: "2 King Beds",
    roomSize: "680 sq.ft",
    image: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1200",
    amenities: ["Misty Mountain View", "Private Viewing Deck", "Family Dining Area", "Free Wi-Fi"],
    isActive: true,
  },

  // JW Marriott Hotel Kolkata
  {
    hotelId: "jw-marriot",
    name: "Deluxe King Room",
    description: "Sophisticated modern room with floor-to-ceiling city views, plush bedding, and marble bath.",
    price: 8000,
    capacity: 2,
    totalInventory: 8,
    bedType: "King Bed",
    roomSize: "410 sq.ft",
    image: "https://res.cloudinary.com/wnc9d18t/image/upload/v1794739833/stayease/rooms/uonicshcdt2h0c50glg2.jpg",
    amenities: ["City Skyline View", "JW Kitchen Access", "Free Wi-Fi", "Rain Shower", "Work Desk"],
    isActive: true,
  },
  {
    hotelId: "jw-marriot",
    name: "Executive Club Room",
    description: "High-floor room with panoramic EM Bypass skyline views and exclusive Executive Lounge privileges.",
    price: 12500,
    capacity: 2,
    totalInventory: 6,
    bedType: "King Bed",
    roomSize: "450 sq.ft",
    image: "https://res.cloudinary.com/wnc9d18t/image/upload/v1794739565/stayease/hotels/zvgkthqfcus25bfvdgsu.jpg",
    amenities: ["Executive Lounge Access", "Evening Cocktails", "City View", "Free Wi-Fi", "Espresso Machine"],
    isActive: true,
  },

  // BrijRama Palace Varanasi
  {
    hotelId: "brijrama-palace",
    name: "Nadidhara Ganga View Room",
    description: "Sacred riverfront room facing the sunrise over the Holy River Ganges with private jharokha seat.",
    price: 19500,
    capacity: 2,
    totalInventory: 5,
    bedType: "King Bed",
    roomSize: "420 sq.ft",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Direct Ganges View", "Ganga Aarti Boat Ride Included", "Vegetarian Delicacies", "Free Wi-Fi"],
    isActive: true,
  },
  {
    hotelId: "brijrama-palace",
    name: "Maharaja Ganga Suite",
    description: "The crown suite of Darbhanga Ghat with royal seating terrace and 180-degree views of the Varanasi ghats.",
    price: 36000,
    capacity: 3,
    totalInventory: 2,
    bedType: "King Bed + Diwan",
    roomSize: "720 sq.ft",
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Panoramic Ghats View", "Private Terrace", "Personal Butler", "Spiritual Library", "Free Wi-Fi"],
    isActive: true,
  },
];

async function seed() {
  console.log("Starting Indian Hotels & Rooms seed...");

  // 1. Fetch existing hotels from hotel-service
  const hotelsRes = await fetch(`${HOTEL_SERVICE_URL}/hotels?includeInactive=true`);
  const existingHotels = hotelsRes.ok ? await hotelsRes.json() : [];
  console.log(`Found ${existingHotels.length} existing hotels in database.`);

  const hotelMapBySlug = new Map();
  for (const h of existingHotels) {
    if (h.slug) hotelMapBySlug.set(h.slug.toLowerCase(), h);
  }

  // Hide dummy test hotels if they exist (dfdf, earerb)
  for (const h of existingHotels) {
    if (["dfdf", "earerb"].includes(h.slug)) {
      console.log(`Deactivating dummy test hotel: ${h.name} (${h.slug})`);
      await fetch(`${HOTEL_SERVICE_URL}/hotels/${h._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
    }
  }

  // 2. Insert or update each Indian Hotel
  for (const hotelData of INDIAN_HOTELS) {
    const existing = hotelMapBySlug.get(hotelData.slug.toLowerCase());
    if (existing) {
      console.log(`Updating existing Indian hotel: ${hotelData.name} (${hotelData.slug})`);
      const updateRes = await fetch(`${HOTEL_SERVICE_URL}/hotels/${existing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hotelData),
      });
      if (!updateRes.ok) {
        console.error(`Failed to update ${hotelData.name}:`, await updateRes.text());
      } else {
        hotelMapBySlug.set(hotelData.slug.toLowerCase(), await updateRes.json());
      }
    } else {
      console.log(`Creating new Indian hotel: ${hotelData.name} (${hotelData.slug})`);
      const createRes = await fetch(`${HOTEL_SERVICE_URL}/hotels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hotelData),
      });
      if (!createRes.ok) {
        console.error(`Failed to create ${hotelData.name}:`, await createRes.text());
      } else {
        const created = await createRes.json();
        hotelMapBySlug.set(hotelData.slug.toLowerCase(), created);
      }
    }
  }

  // 3. Fetch existing rooms
  const roomsRes = await fetch(`${ROOM_SERVICE_URL}/rooms?includeInactive=true`);
  const existingRooms = roomsRes.ok ? await roomsRes.json() : [];
  console.log(`Found ${existingRooms.length} existing rooms in database.`);

  const roomMapByKey = new Map();
  for (const r of existingRooms) {
    roomMapByKey.set(`${r.hotelId}::${r.name}`.toLowerCase(), r);
  }

  // 4. Insert or update each room
  let roomsInserted = 0;
  let roomsUpdated = 0;

  for (const roomData of INDIAN_ROOMS) {
    const key = `${roomData.hotelId}::${roomData.name}`.toLowerCase();
    const existing = roomMapByKey.get(key);

    if (existing) {
      const updateRes = await fetch(`${ROOM_SERVICE_URL}/rooms/${existing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomData),
      });
      if (updateRes.ok) {
        roomsUpdated++;
      } else {
        console.error(`Failed to update room ${roomData.name}:`, await updateRes.text());
      }
    } else {
      const createRes = await fetch(`${ROOM_SERVICE_URL}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomData),
      });
      if (createRes.ok) {
        roomsInserted++;
      } else {
        console.error(`Failed to create room ${roomData.name}:`, await createRes.text());
      }
    }
  }

  console.log(`Rooms summary: ${roomsInserted} created, ${roomsUpdated} updated.`);
  console.log("Indian Hotels & Rooms seed completed successfully!");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});

