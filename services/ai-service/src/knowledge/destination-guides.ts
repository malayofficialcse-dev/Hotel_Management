export interface DestinationGuide {
  city: string;
  state: string;
  tagline: string;
  bestTimeToVisit: string;
  sightseeing: { name: string; description: string; bestTime: string }[];
  foodSpots: { name: string; speciality: string; location: string }[];
  localTransit: { type: string; info: string }[];
  tips: string[];
}

export const destinationGuides: Record<string, DestinationGuide> = {
  goa: {
    city: "Goa",
    state: "Goa",
    tagline: "Sun-kissed beaches, Portuguese heritage, and vibrant susegad culture",
    bestTimeToVisit: "November to March",
    sightseeing: [
      { name: "Candolim & Sinquerim Beach", description: "Clean golden sands, water sports (jet-skiing, parasailing), and sunset view near Aguada Fort.", bestTime: "4:00 PM – 6:30 PM" },
      { name: "Fort Aguada & Light House", description: "17th-century Portuguese fort overlooking the vast Arabian Sea and Sinquerim beach.", bestTime: "9:30 AM – 12:00 PM" },
      { name: "Chapora Fort ('Dil Chahta Hai' Fort)", description: "Iconic red-laterite cliff fort offering panoramic vistas of Vagator and Anjuna beaches.", bestTime: "5:00 PM – 6:45 PM" },
      { name: "Old Goa Churches (Basilica of Bom Jesus)", description: "UNESCO World Heritage Baroque churches with ornate gilded altars.", bestTime: "10:00 AM – 1:00 PM" },
      { name: "Mandovi River Sunset Cruise", description: "Scenic 1-hour cultural catamaran cruise with Goan folk dancing and live DJ.", bestTime: "6:00 PM & 7:15 PM sailings" },
    ],
    foodSpots: [
      { name: "Fisherman's Wharf", speciality: "Goan Fish Curry Rice, Butter Garlic Prawns, and Bebinca", location: "Cavelossim & Panaji" },
      { name: "Britto's Shack", speciality: "Crab Xec Xec, Prawn Balchão, and Fresh Seafood Grills", location: "Baga Beach" },
      { name: "Vinayak Family Restaurant", speciality: "Authentic local Goan Thali with Kingfish Rava Fry", location: "Assagao" },
      { name: "Viva Panjim", speciality: "Pork Vindaloo, Chicken Xacuti, and Caramel Custard", location: "Fontainhas Latin Quarter, Panaji" },
    ],
    localTransit: [
      { type: "Mandovi River Ferry", info: "Betim–Panaji ferry runs every 15 minutes (Free for pedestrians, ₹5 for two-wheelers)." },
      { type: "Chorao Island Ferry", info: "Ribandar to Chorao ferry connects to Salim Ali Bird Sanctuary every 20 minutes." },
      { type: "Scooter / Self-Drive", info: "Available for rent at ₹350–₹500/day across Candolim and Calangute." },
    ],
    tips: [
      "Carry sunscreen and sunglasses for midday beach visits.",
      "Dress respectfully when visiting Old Goa churches and temples (cover shoulders and knees).",
      "Haggle politely at the Wednesday Anjuna Flea Market and Saturday Night Bazaar in Arpora.",
    ],
  },

  kolkata: {
    city: "Kolkata",
    state: "West Bengal",
    tagline: "The City of Joy — historic architecture, literary cafes, and unmatched culinary treasures",
    bestTimeToVisit: "October to March",
    sightseeing: [
      { name: "Victoria Memorial Hall", description: "Magnificent white Makrana marble monument surrounded by 64 acres of landscaped gardens.", bestTime: "10:00 AM – 1:00 PM" },
      { name: "Howrah Bridge & Mullick Ghat Flower Market", description: "Iconic cantilever steel bridge over the Hooghly river and Asia's largest fragrant flower market.", bestTime: "6:30 AM – 8:30 AM" },
      { name: "Dakshineswar Kali Temple & Belur Math", description: "Sacred 19th-century temple complex visited by Ramakrishna Paramahamsa along the riverbanks.", bestTime: "7:00 AM – 11:30 AM" },
      { name: "Indian Museum", description: "Oldest and ninth oldest museum in the world, featuring 4,000-year-old Egyptian mummy and fossil galleries.", bestTime: "11:00 AM – 3:00 PM" },
      { name: "Princep Ghat", description: "Palladian porch along the Hooghly river; evening boat rides under Vidyasagar Setu.", bestTime: "4:30 PM – 7:00 PM" },
    ],
    foodSpots: [
      { name: "Peter Cat", speciality: "Original Chelo Kebab with buttered saffron rice and baked egg", location: "Park Street" },
      { name: "Flurrys", speciality: "English Breakfast, Rum Balls, and Darjeeling First Flush Tea", location: "Park Street" },
      { name: "Arsalan", speciality: "Authentic Kolkata Biryani with fragrant spiced potato and boiled egg", location: "Park Circus" },
      { name: "Balaram Mullick & Radharaman Mullick", speciality: "Baked Rasgulla, Mishti Doi, and Nolen Gur Sandesh", location: "Bhowanipore & Salt Lake" },
      { name: "Kusum Rolls", speciality: "Crispy Egg Chicken Roll with zesty lime & green chillies", location: "Park Street" },
    ],
    localTransit: [
      { type: "Hooghly River Ferry", info: "Fairlie Place to Howrah Station ferry operates every 10–15 mins (₹6/ticket); breathtaking skyline view." },
      { type: "Heritage Kolkata Tram", info: "Route 24/29 operates through Maidan and College Street — Asia's oldest operating tram network." },
      { type: "Kolkata Metro", info: "India's first underwater metro tunnel (Green Line) connects Howrah to Salt Lake in under 15 minutes." },
    ],
    tips: [
      "Try local street puchkas (pani puri) at Vivekananda Park or Vardaan Market.",
      "Take an early morning heritage walk through North Kolkata's Sovabazar bonedi bari mansions.",
      "Kolkata yellow ambassador taxis use standard meter fares or ride-hailing apps.",
    ],
  },

  udaipur: {
    city: "Udaipur",
    state: "Rajasthan",
    tagline: "The City of Lakes — romantic marble palaces, shimmering waters, and royal Mewari heritage",
    bestTimeToVisit: "September to March",
    sightseeing: [
      { name: "City Palace Complex", description: "Vast granite and marble palace complex overlooking Lake Pichola with mirrored courtyards.", bestTime: "9:00 AM – 12:30 PM" },
      { name: "Lake Pichola Sunset Boat Ride", description: "Scenic cruise passing Taj Lake Palace and Jag Mandir Island palace during golden hour.", bestTime: "4:45 PM – 6:15 PM" },
      { name: "Saheliyon-ki-Bari", description: "Historic royal garden of the maids with marble elephants, fountains, and lotus pools.", bestTime: "11:00 AM – 1:00 PM" },
      { name: "Sajjangarh (Monsoon Palace)", description: "Hilltop fortress atop the Aravalli hills with 360-degree panorama of lakes and sunset.", bestTime: "5:00 PM – 6:45 PM" },
    ],
    foodSpots: [
      { name: "Ambrai Restaurant", speciality: "Mewari Laal Maas, Dal Baati Churma with illuminated Lake Palace view", location: "Amet Haveli, Ambavgarh" },
      { name: "Upre by 1559 AD", speciality: "Ker Sangri, Rajasthani Thali, and sunset cocktails", location: "Lake Pichola rooftop" },
      { name: "JMB (Jagdish Mishtan Bhandar)", speciality: "Pyaz Kachori, Mirchi Vada, and Ghewar", location: "Surajpole" },
    ],
    localTransit: [
      { type: "Lake Pichola Public Ferry", info: "Boats depart Rameshwar Ghat to Jag Mandir every hour between 10:00 AM and 5:00 PM." },
      { type: "Auto-Rickshaws", info: "Readily available at old city ghats; negotiate or use app rides for Fatehsagar Lake." },
    ],
    tips: [
      "Book the sunset boat tour at Lake Pichola at least 2 hours in advance during peak season.",
      "Carry comfortable walking shoes for the cobblestone alleyways around Lal Ghat and Gangaur Ghat.",
    ],
  },

  kumarakom: {
    city: "Kumarakom",
    state: "Kerala",
    tagline: "Serene backwaters, swaying coconut palms, and peaceful Ayurvedic sanctuaries",
    bestTimeToVisit: "September to March",
    sightseeing: [
      { name: "Vembanad Lake Backwater Cruise", description: "Drift along emerald lagoons in traditional Kettuvallam houseboats or country canoes.", bestTime: "8:00 AM – 11:30 AM or 3:30 PM – 6:00 PM" },
      { name: "Kumarakom Bird Sanctuary", description: "14-acre mangrove forest sheltering Siberian storks, egrets, darter birds, and teal.", bestTime: "6:00 AM – 8:30 AM" },
      { name: "Aymanam Village Heritage Walk", description: "Picturesque village immortalised in Arundhati Roy’s 'The God of Small Things'.", bestTime: "8:30 AM – 11:00 AM" },
    ],
    foodSpots: [
      { name: "Karimpumkala Restaurant", speciality: "Karimeen Pollichathu (Pearl Spot in banana leaf), Prawn Roast, and Appam", location: "Pallom, Kottayam" },
      { name: "Tharavadu Heritage Restaurant", speciality: "Kerala Syrian Beef Fry, Fish Moilee, and Idiyappam", location: "Near Kumarakom Boat Jetty" },
    ],
    localTransit: [
      { type: "SWTD Government Public Water Bus", info: "Muhamma to Kumarakom ferry operates every 45 mins (₹15/passenger) with panoramic backwater views." },
    ],
    tips: [
      "Try fresh coconut water directly from roadside groves.",
      "Experience an authentic Ayurvedic Abhyanga massage at licensed wellness retreats.",
    ],
  },

  jaipur: {
    city: "Jaipur",
    state: "Rajasthan",
    tagline: "The Pink City — grand hillforts, royal Rajput palaces, and bustling artisanal bazaars",
    bestTimeToVisit: "October to March",
    sightseeing: [
      { name: "Amber Fort & Palace", description: "Majestic hilltop fort with Sheesh Mahal (Hall of Mirrors) and Maota Lake reflection.", bestTime: "8:30 AM – 11:30 AM" },
      { name: "Hawa Mahal (Palace of Winds)", description: "Iconic 5-story pink honeycomb facade with 953 jharokha latticed windows.", bestTime: "9:00 AM – 10:30 AM" },
      { name: "Nahargarh Fort Sunset Point", description: "Breathtaking cliff fortress overlooking the golden Pink City horizon at twilight.", bestTime: "5:00 PM – 6:30 PM" },
    ],
    foodSpots: [
      { name: "Laxmi Mishtan Bhandar (LMB)", speciality: "Paneer Ghewar, Raj Kachori, and Royal Rajasthani Thali", location: "Johari Bazaar" },
      { name: "Rawat Mishthan Bhandar", speciality: "Crispy Mawa Kachori & Pyaaz Kachori", location: "Station Road" },
      { name: "Tapri The Tea House", speciality: "Handcrafted Kulhad Chai, Bun Maska, and Khakra Pizza", location: "C-Scheme" },
    ],
    localTransit: [
      { type: "Jaipur Metro (Pink Line)", info: "Connects Mansarovar to Badi Chaupar (directly outside Hawa Mahal)." },
      { type: "E-Rickshaws", info: "Eco-friendly rides throughout the Walled Pink City gates." },
    ],
    tips: [
      "Buy the Jaipur Composite Ticket for 8 monuments to save money and bypass ticket queues.",
      "Shop for authentic block-print textiles and blue pottery at Bapu Bazaar and Johari Bazaar.",
    ],
  },
};

export const DESTINATION_GUIDES = destinationGuides;

