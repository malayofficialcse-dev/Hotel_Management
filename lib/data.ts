export type Hotel = {
  id: string;
  name: string;
  city: string;
  location: string;
  image: string;
  galleryImages?: string[];
  price: number;
  rating: string;
  reviews: number;
  description?: string;
  tag: string;
  features: string[];
  offer: string;
  category: "Boutique hotels" | "Beach resorts" | "Heritage stays" | "City hotels" | "Villas & retreats";
};

export const hotels: Hotel[] = [
  {
    id: "palm-house",
    name: "The Palm House",
    city: "Goa",
    location: "Candolim Beach Road, North Goa",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 8000,
    rating: "4.8",
    reviews: 324,
    tag: "Your coastal escape",
    features: ["Free Wi-Fi", "Infinity Pool", "Complimentary Breakfast", "Spa & Wellness", "Beach Access"],
    offer: "10% off your first stay",
    category: "Beach resorts",
  },
  {
    id: "haveli",
    name: "Haveli & Co.",
    city: "Jaipur",
    location: "Civil Lines, Jaipur, Rajasthan",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 6500,
    rating: "4.9",
    reviews: 218,
    tag: "Heritage hideaway",
    features: ["Free Wi-Fi", "Swimming Pool", "Heritage Courtyard", "Rooftop Restaurant", "Cultural Evenings"],
    offer: "Breakfast on us",
    category: "Heritage stays",
  },
  {
    id: "lakehouse",
    name: "Lakehouse Retreat",
    city: "Udaipur",
    location: "Lake Pichola, Udaipur, Rajasthan",
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 12400,
    rating: "4.9",
    reviews: 186,
    tag: "Lakeside luxury",
    features: ["Lake View", "Infinity Pool", "Fine Dining", "Private Boat Transfer", "Butler Service"],
    offer: "Save 15% on 3+ nights",
    category: "Boutique hotels",
  },
  {
    id: "taj-mahal-palace",
    name: "The Taj Mahal Palace",
    city: "Mumbai",
    location: "Apollo Bunder, Colaba, Mumbai, Maharashtra",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 18500,
    rating: "4.9",
    reviews: 540,
    tag: "Iconic heritage landmark",
    features: ["Sea View", "Swimming Pool", "Spa & Wellness", "Fine Dining", "Butler Service"],
    offer: "Heritage walk & high tea included",
    category: "Heritage stays",
  },
  {
    id: "oberoi-udaivilas",
    name: "The Oberoi Udaivilas",
    city: "Udaipur",
    location: "Haridas Ji Ki Magri, Lake Pichola, Udaipur, Rajasthan",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 26000,
    rating: "5.0",
    reviews: 380,
    tag: "Royal Rajasthani grandeur",
    features: ["Private Pool Access", "Lake View", "Luxury Spa", "Yoga Sessions", "Fine Dining"],
    offer: "Save 15% on 3+ nights",
    category: "Boutique hotels",
  },
  {
    id: "itc-grand-chola",
    name: "ITC Grand Chola",
    city: "Chennai",
    location: "Anna Salai, Guindy, Chennai, Tamil Nadu",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 9500,
    rating: "4.8",
    reviews: 410,
    tag: "Chola architectural tribute",
    features: ["Free Wi-Fi", "Swimming Pool", "Kaya Kalp Spa", "Multi-Cuisine Dining", "Fitness Center"],
    offer: "15% dining credit on all restaurants",
    category: "City hotels",
  },
  {
    id: "kumarakom-lake-resort",
    name: "Kumarakom Lake Resort",
    city: "Kumarakom",
    location: "North Post, Kumarakom, Kottayam, Kerala",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 13500,
    rating: "4.9",
    reviews: 295,
    tag: "Serene backwater paradise",
    features: ["Meandering Pool", "Ayurvedic Spa", "Houseboat Cruises", "Lake View Dining"],
    offer: "Sunset backwater cruise included",
    category: "Beach resorts",
  },
  {
    id: "evolve-back-coorg",
    name: "Evolve Back, Chikkana Halli Estate",
    city: "Coorg",
    location: "Karadigodu Post, Siddapur, Coorg, Karnataka",
    image: "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 16000,
    rating: "4.9",
    reviews: 310,
    tag: "Plantation life in coffee country",
    features: ["Private Pool", "Ayurvedic Spa", "Coffee Plantation Tour", "Bird Watching"],
    offer: "Coffee trail & tasting included",
    category: "Villas & retreats",
  },
  {
    id: "the-leela-palace-bengaluru",
    name: "The Leela Palace",
    city: "Bengaluru",
    location: "HAL Old Airport Road, Kodihalli, Bengaluru, Karnataka",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 11500,
    rating: "4.8",
    reviews: 460,
    tag: "Modern palace amidst gardens",
    features: ["Lagoon Pool", "Luxury Spa", "Pan-Asian Dining", "Business Center", "Valet Parking"],
    offer: "10% off for weekend stays",
    category: "City hotels",
  },
  {
    id: "wildflower-hall-shimla",
    name: "Wildflower Hall, An Oberoi Resort",
    city: "Shimla",
    location: "Chharabra, Shimla, Himachal Pradesh",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 21000,
    rating: "4.9",
    reviews: 275,
    tag: "Cedar forest mountain sanctuary",
    features: ["Heated Outdoor Whirlpool", "Mountain View", "Spa Pavilions", "Nature Walks"],
    offer: "Complimentary cedar nature trail walk",
    category: "Villas & retreats",
  },
  {
    id: "umaid-bhawan-palace",
    name: "Umaid Bhawan Palace",
    city: "Jodhpur",
    location: "Circuit House Road, Cantt Area, Jodhpur, Rajasthan",
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 24000,
    rating: "4.9",
    reviews: 520,
    tag: "Living royal palace of Marwar",
    features: ["Palace Lawns", "Subterranean Pool", "Jiva Grande Spa", "Vintage Car Collection"],
    offer: "Royal arrival welcome & museum entry",
    category: "Heritage stays",
  },
  {
    id: "monsoon-grove",
    name: "Monsoon Grove Retreat",
    city: "Munnar",
    location: "Pallivasal Tea Estate, Munnar, Kerala",
    image: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1200",
    galleryImages: [
      "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ],
    price: 8800,
    rating: "4.8",
    reviews: 154,
    tag: "A hideaway in the hills",
    features: ["Free Wi-Fi", "Mountain View", "Breakfast Included", "Tea Garden Walks"],
    offer: "Save 12% on a 2-night stay",
    category: "Villas & retreats",
  },
  {
    id: "jw-marriot",
    name: "JW Marriott Hotel Kolkata",
    city: "Kolkata",
    location: "4A, J.B.S. Haldane Avenue, Topsia, Kolkata, West Bengal",
    image: "https://res.cloudinary.com/wnc9d18t/image/upload/v1794739565/stayease/hotels/zvgkthqfcus25bfvdgsu.jpg",
    galleryImages: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 8000,
    rating: "4.8",
    reviews: 340,
    tag: "Contemporary luxury in Kolkata",
    features: ["Infinity Pool", "Spa by JW", "JW Kitchen", "Executive Lounge"],
    offer: "10% off with breakfast buffet",
    category: "City hotels",
  },
  {
    id: "brijrama-palace",
    name: "BrijRama Palace",
    city: "Varanasi",
    location: "Darbhanga Ghat, Dashashwamedh, Varanasi, Uttar Pradesh",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80"
    ],
    price: 19500,
    rating: "4.9",
    reviews: 280,
    tag: "Heritage palace on the Holy Ganges",
    features: ["River Ganges View", "Vegetarian Dining", "Traditional Music", "Ayurvedic Spa"],
    offer: "Private Bajra boat ride for Ganga Aarti",
    category: "Heritage stays",
  },
];

export const roomTypes = [
  {
    id: "deluxe-king",
    name: "Deluxe King Room",
    beds: "1 king bed · 2 adults · 38 m²",
    detail: "Pool or garden view · Work desk",
    inclusions: "Breakfast included · Free Wi-Fi · Air conditioning",
    price: 8000,
    image: "/assets/figma/a0108.png",
  },
  {
    id: "heritage-suite",
    name: "Heritage Royal Suite",
    beds: "1 four-poster king · 2 adults · 42 m²",
    detail: "Courtyard view · Handcrafted decor",
    inclusions: "Breakfast included · Free Wi-Fi · Air conditioning",
    price: 6500,
    image: "/assets/figma/185bf.png",
  },
  {
    id: "lakefront-palace",
    name: "Lakefront Palace Room",
    beds: "1 king bed · 2 adults · 50 m²",
    detail: "Lake Pichola view · Private balcony",
    inclusions: "Breakfast included · Free Wi-Fi · Butler service",
    price: 12400,
    image: "/assets/figma/b62b5.png",
  },
  {
    id: "ocean-view-villa",
    name: "Ocean View Villa",
    beds: "2 king beds · 4 adults · 75 m²",
    detail: "Private plunge pool · Arabian Sea view",
    inclusions: "Breakfast included · Free Wi-Fi · Espresso machine",
    price: 14500,
    image: "/assets/figma/185bf.png",
  },
  {
    id: "sea-view-suite",
    name: "Luxury Sea View Suite",
    beds: "1 king bed + daybed · 3 adults · 78 m²",
    detail: "Gateway of India view · Separate lounge",
    inclusions: "Breakfast included · Free Wi-Fi · High tea",
    price: 32000,
    image: "/assets/figma/2c4d3.png",
  },
  {
    id: "premier-pool-room",
    name: "Premier Room with Semi-Private Pool",
    beds: "1 king bed · 2 adults · 60 m²",
    detail: "Direct pool access · Sunken marble bath",
    inclusions: "Breakfast included · Free Wi-Fi · Spa credit",
    price: 26000,
    image: "/assets/figma/ef36a.png",
  },
  {
    id: "family-courtyard",
    name: "Courtyard Family Room",
    beds: "2 queen beds · 4 adults · 62 m²",
    detail: "Courtyard view · Living area",
    inclusions: "Breakfast included · Free Wi-Fi · Air conditioning",
    price: 9200,
    image: "/assets/figma/0e438.png",
  },
];

export const formatPrice = (amount: number) =>
  `₹${amount.toLocaleString("en-IN")}`;

export const defaultSavedHotels = hotels.map((hotel) => hotel.id);
