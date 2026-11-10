export type Hotel = {
  id: string;
  name: string;
  city: string;
  location: string;
  image: string;
  price: number;
  rating: string;
  reviews: number;
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
    location: "Candolim, Goa",
    image: "/assets/figma/a0108.png",
    price: 8000,
    rating: "4.8",
    reviews: 324,
    tag: "Your coastal escape",
    features: ["Free Wi-Fi", "Pool", "Breakfast"],
    offer: "10% off your first stay",
    category: "Beach resorts",
  },
  {
    id: "haveli",
    name: "Haveli & Co.",
    city: "Jaipur",
    location: "Civil Lines, Jaipur",
    image: "/assets/figma/185bf.png",
    price: 6500,
    rating: "4.9",
    reviews: 218,
    tag: "Heritage hideaway",
    features: ["Free Wi-Fi", "Pool", "Breakfast"],
    offer: "Breakfast on us",
    category: "Heritage stays",
  },
  {
    id: "lakehouse",
    name: "Lakehouse Retreat",
    city: "Udaipur",
    location: "Lake Pichola, Udaipur",
    image: "/assets/figma/b62b5.png",
    price: 12400,
    rating: "4.9",
    reviews: 186,
    tag: "Lakeside luxury",
    features: ["Free Wi-Fi", "Pool", "Breakfast"],
    offer: "Save 15% on 3+ nights",
    category: "Boutique hotels",
  },
  {
    id: "green-canopy",
    name: "The Green Canopy",
    city: "Coorg",
    location: "Madikeri, Coorg",
    image: "/assets/figma/bbf8e.png",
    price: 7200,
    rating: "4.7",
    reviews: 265,
    tag: "Into the green",
    features: ["Free Wi-Fi", "Pool", "Breakfast"],
    offer: "Complimentary nature walk",
    category: "Villas & retreats",
  },
  {
    id: "marine-collective",
    name: "The Marine Collective",
    city: "Mumbai",
    location: "Marine Drive, Mumbai",
    image: "/assets/figma/679d7.png",
    price: 9600,
    rating: "4.8",
    reviews: 412,
    tag: "City, with a sea view",
    features: ["Free Wi-Fi", "Pool", "Breakfast"],
    offer: "Members save 10%",
    category: "City hotels",
  },
  {
    id: "river-root",
    name: "River & Root",
    city: "Rishikesh",
    location: "Tapovan, Rishikesh",
    image: "/assets/figma/c0212.png",
    price: 5800,
    rating: "4.7",
    reviews: 193,
    tag: "A little more zen",
    features: ["Free Wi-Fi", "Pool", "Breakfast"],
    offer: "Morning yoga included",
    category: "Villas & retreats",
  },
];

export const roomTypes = [
  {
    id: "single",
    name: "Single Room",
    beds: "1 single bed · 1 adult · 18 m²",
    detail: "Garden view · Work desk",
    inclusions: "Breakfast included · Free Wi-Fi · Air conditioning",
    price: 4000,
    image: "/assets/figma/ec50a.png",
  },
  {
    id: "double",
    name: "Double Room",
    beds: "1 queen bed · 2 adults · 24 m²",
    detail: "Garden view · Rain shower",
    inclusions: "Breakfast included · Free Wi-Fi · Air conditioning",
    price: 6000,
    image: "/assets/figma/7546e.png",
  },
  {
    id: "deluxe",
    name: "Deluxe Room",
    beds: "1 king bed · 2 adults · 32 m²",
    detail: "Private balcony · Pool view",
    inclusions: "Breakfast included · Free Wi-Fi · Air conditioning",
    price: 8000,
    image: "/assets/figma/ef36a.png",
  },
  {
    id: "suite",
    name: "Suite Room",
    beds: "1 king bed · 2 adults + 1 child · 58 m²",
    detail: "Ocean view · Living area",
    inclusions: "Breakfast included · Free Wi-Fi · Air conditioning",
    price: 14000,
    image: "/assets/figma/2c4d3.png",
  },
  {
    id: "family",
    name: "Family Room",
    beds: "2 queen beds · 4 adults · 45 m²",
    detail: "Connecting space · Garden view",
    inclusions: "Breakfast included · Free Wi-Fi · Air conditioning",
    price: 11000,
    image: "/assets/figma/0e438.png",
  },
];

export const formatPrice = (amount: number) =>
  `₹${amount.toLocaleString("en-IN")}`;

export const defaultSavedHotels = hotels.map((hotel) => hotel.id);
