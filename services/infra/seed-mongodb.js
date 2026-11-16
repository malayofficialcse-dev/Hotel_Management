/**
 * StayEase Enterprise Hotel Platform - MongoDB Seed Script
 * Seeds:
 *  1. hotel_catalog.hotels (7 luxury/boutique properties)
 *  2. hotel_catalog.rooms (18 distinct room types linked to hotels)
 *  3. hotel_catalog.offers (seasonal promotion discounts)
 *  4. hotel_housekeeping.housekeepingtasks (room cleaning & maintenance tasks)
 *  5. hotel_reviews.reviews (verified guest reviews with detailed rating breakdowns)
 */

const mongoose = require('d:/all/Major_Project/hotel_management/services/hotel-service/node_modules/mongoose');

const MONGODB_HOST = process.env.MONGODB_URI || 'mongodb://localhost:27017';

const HOTELS_DATA = [
  {
    slug: 'palm-house',
    name: 'The Palm House',
    city: 'Goa',
    location: 'Candolim Beach Road, North Goa',
    mainImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
    ],
    basePrice: 8000,
    rating: 4.8,
    reviewsCount: 324,
    tag: 'Your coastal escape',
    offer: '10% off your first stay',
    category: 'Beach resorts',
    description: 'Nestled among tranquil palm groves just minutes from Candolim Beach, The Palm House combines tropical serenity with boutique luxury. Featuring oceanfront villas, private plunge pools, and open-air coastal dining.',
    amenities: ['Free Wi-Fi', 'Infinity Pool', 'Complimentary Breakfast', 'Spa & Wellness', 'Beach Access', 'Bar & Lounge', 'Airport Shuttle', 'Room Service'],
    isActive: true
  },
  {
    slug: 'haveli',
    name: 'Haveli & Co.',
    city: 'Jaipur',
    location: 'Civil Lines, Jaipur, Rajasthan',
    mainImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80'
    ],
    basePrice: 6500,
    rating: 4.9,
    reviewsCount: 218,
    tag: 'Heritage hideaway',
    offer: 'Royal breakfast included',
    category: 'Heritage stays',
    description: 'A meticulously restored 19th-century royal haveli showcasing Rajasthani architecture, handcrafted jharokhas, courtyards, and rooftop sunset dining overlooking the Pink City.',
    amenities: ['Free Wi-Fi', 'Swimming Pool', 'Heritage Courtyard', 'Rooftop Restaurant', 'Cultural Evenings', 'Spa', 'Valet Parking'],
    isActive: true
  },
  {
    slug: 'lakehouse',
    name: 'Lakehouse Retreat',
    city: 'Udaipur',
    location: 'Lake Pichola Banks, Udaipur, Rajasthan',
    mainImage: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
    ],
    basePrice: 12400,
    rating: 4.9,
    reviewsCount: 186,
    tag: 'Lakeside luxury',
    offer: 'Save 15% on 3+ nights',
    category: 'Boutique hotels',
    description: 'Perched on the serene banks of Lake Pichola with breathtaking panoramic views of the City Palace, private boat transfers, bespoke butler service, and candlelit lakeside dining.',
    amenities: ['Lake View', 'Infinity Pool', 'Fine Dining', 'Private Boat Transfer', 'Butler Service', 'Fitness Center', 'Sunset Terrace'],
    isActive: true
  },
  {
    slug: 'monsoon-grove',
    name: 'Monsoon Grove Retreat',
    city: 'Munnar',
    location: 'Pallivasal Tea Estate, Munnar, Kerala',
    mainImage: 'https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'
    ],
    basePrice: 8800,
    rating: 4.8,
    reviewsCount: 154,
    tag: 'A hideaway in the hills',
    offer: 'Save 12% on 2-night stay',
    category: 'Villas & retreats',
    description: 'A misty hillside sanctuary in Munnar enveloped by rolling organic tea plantations and cascading waterfalls. Immerse in bird watching, nature trails, and authentic Kerala Ayurvedic therapies.',
    amenities: ['Mountain View', 'Free Wi-Fi', 'Complimentary Breakfast', 'Nature Trails', 'Ayurvedic Spa', 'Fireplace', 'Tea Tasting'],
    isActive: true
  },
  {
    slug: 'bluewater-cove',
    name: 'Bluewater Cove Resort',
    city: 'Havelock Island',
    location: 'Vijay Nagar Beach No. 5, Andaman & Nicobar',
    mainImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80'
    ],
    basePrice: 11200,
    rating: 4.9,
    reviewsCount: 207,
    tag: 'Island time, well spent',
    offer: 'Complimentary ferry pickup',
    category: 'Beach resorts',
    description: 'Crystal turquoise waters and private powder-white sands await at Bluewater Cove. Featuring wooden stilt cottages, certified scuba diving excursions, and fresh seafood barbecue on the shore.',
    amenities: ['Private Beach', 'Scuba & Snorkeling', 'Swimming Pool', 'Beachfront Dining', 'Free Wi-Fi', 'Kayak Rentals'],
    isActive: true
  },
  {
    slug: 'amber-courtyard',
    name: 'Amber Courtyard Palace',
    city: 'Jaisalmer',
    location: 'Fort Road, Near Golden Fort, Jaisalmer',
    mainImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
    ],
    basePrice: 7600,
    rating: 4.7,
    reviewsCount: 132,
    tag: 'Desert heritage, warmly hosted',
    offer: 'Desert safari & dinner included',
    category: 'Heritage stays',
    description: 'Carved from yellow Jaisalmer sandstone, Amber Courtyard Palace offers a regal gateway to the Thar Desert with evening folk dance performances, camel safaris, and starlit rooftop banquets.',
    amenities: ['Heritage Courtyard', 'Rooftop Restaurant', 'Desert Safari Desk', 'Cultural Evenings', 'Free Wi-Fi', 'Air Conditioning'],
    isActive: true
  },
  {
    slug: 'harborlight-house',
    name: 'Harborlight House',
    city: 'Kochi',
    location: 'Tower Road, Fort Kochi, Kerala',
    mainImage: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80'
    ],
    basePrice: 6900,
    rating: 4.8,
    reviewsCount: 176,
    tag: 'A slower side of the city',
    offer: 'Free late checkout & harbor cruise',
    category: 'City luxury',
    description: 'A stately colonial mansion overlooking the Arabian Sea and historic Chinese fishing nets. Combining Portuguese architecture with contemporary art, artisanal coffees, and harbor breeze courtyards.',
    amenities: ['Harbor View', 'Boutique Cafe', 'Art Gallery', 'Free Wi-Fi', 'Bicycle Rentals', 'Complimentary Breakfast'],
    isActive: true
  }
];

const ROOMS_DATA = [
  // The Palm House (Goa)
  {
    hotelId: 'palm-house',
    name: 'Deluxe King Room',
    description: 'Spacious king-bedded retreat with private veranda overlooking the tropical resort pool and palms.',
    price: 8000,
    capacity: 2,
    totalInventory: 10,
    bedType: 'King Bed',
    roomSize: '380 sq.ft',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
    amenities: ['Free Wi-Fi', 'Pool View', 'Mini Bar', 'Air Conditioning', 'Rain Shower', 'Espresso Maker'],
    isActive: true
  },
  {
    hotelId: 'palm-house',
    name: 'Ocean View Villa',
    description: 'Standalone luxury coastal villa featuring panoramic Arabian Sea vistas, private sun deck, and daybed.',
    price: 14500,
    capacity: 4,
    totalInventory: 6,
    bedType: '2 King Beds',
    roomSize: '750 sq.ft',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    amenities: ['Private Plunge Pool', 'Ocean View', 'Balcony', 'Free Wi-Fi', 'Butler Service', 'Walk-in Closet'],
    isActive: true
  },
  {
    hotelId: 'palm-house',
    name: 'Sunset Plunge Pool Suite',
    description: 'Ultra-exclusive corner suite with a heated plunge pool on the private terrace capturing Goa sunsets.',
    price: 19000,
    capacity: 2,
    totalInventory: 4,
    bedType: 'California King',
    roomSize: '620 sq.ft',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    amenities: ['Private Heated Pool', 'Sunset View', 'Complimentary Champagne', 'Spa Bath', 'Breakfast in Bed'],
    isActive: true
  },

  // Haveli & Co. (Jaipur)
  {
    hotelId: 'haveli',
    name: 'Heritage Royal Suite',
    description: 'Ornate suite adorned with antique frescoes, hand-carved teak furnishings, and courtyard views.',
    price: 6500,
    capacity: 2,
    totalInventory: 12,
    bedType: 'Four-Poster King',
    roomSize: '420 sq.ft',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    amenities: ['Courtyard View', 'Handcrafted Decor', 'Soaking Bathtub', 'Free Wi-Fi', 'Heritage Jharokha'],
    isActive: true
  },
  {
    hotelId: 'haveli',
    name: 'Courtyard Family Suite',
    description: 'Sprawling two-bedroom suite connected by an arched corridor, ideal for families desiring royal elegance.',
    price: 9200,
    capacity: 4,
    totalInventory: 8,
    bedType: 'King Bed + 2 Twin Beds',
    roomSize: '650 sq.ft',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    amenities: ['Courtyard View', 'Separate Living Area', 'Two Bathrooms', 'Free Wi-Fi', 'Evening High Tea'],
    isActive: true
  },
  {
    hotelId: 'haveli',
    name: 'Maharaja Presidential Suite',
    description: 'The premier royal chamber boasting a private terrace overlooking the Aravalli hills, personal attendant.',
    price: 22000,
    capacity: 4,
    totalInventory: 2,
    bedType: 'Royal Four-Poster King',
    roomSize: '1100 sq.ft',
    image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80',
    amenities: ['Private Rooftop Terrace', 'Jacuzzi', 'Personal Butler', 'Dining Room', 'Heritage Chandelier'],
    isActive: true
  },

  // Lakehouse Retreat (Udaipur)
  {
    hotelId: 'lakehouse',
    name: 'Lakefront Palace Room',
    description: 'Direct lake views through arched bay windows, marble flooring, and sunset views over Lake Pichola.',
    price: 12400,
    capacity: 2,
    totalInventory: 8,
    bedType: 'King Bed',
    roomSize: '500 sq.ft',
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
    amenities: ['Lake Pichola View', 'Private Balcony', 'Butler Service', 'Free Wi-Fi', 'Marble Bath'],
    isActive: true
  },
  {
    hotelId: 'lakehouse',
    name: 'Royal Lakefront Suite',
    description: 'Magnificent suite with separate parlor, handcrafted brass fittings, and private terrace floating over water.',
    price: 18500,
    capacity: 4,
    totalInventory: 4,
    bedType: 'King Bed + Sofa Bed',
    roomSize: '820 sq.ft',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    amenities: ['Panoramic Lake View', 'Private Terrace', 'Cocktail Bar', 'Butler Service', 'Boat Arrival'],
    isActive: true
  },
  {
    hotelId: 'lakehouse',
    name: 'Pichola Grand Villa',
    description: 'A secluded private residence on the estate with dedicated infinity plunge pool and private boat jetty.',
    price: 28000,
    capacity: 4,
    totalInventory: 2,
    bedType: '2 King Beds',
    roomSize: '1250 sq.ft',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    amenities: ['Private Pool', 'Private Jetty', 'Chef on Demand', 'Panoramic Views', 'Luxury Spa Tub'],
    isActive: true
  },

  // Monsoon Grove Retreat (Munnar)
  {
    hotelId: 'monsoon-grove',
    name: 'Mist Valley Cottage',
    description: 'Charming wooden cottage surrounded by misty green tea bushes with a crackling stone fireplace.',
    price: 8800,
    capacity: 2,
    totalInventory: 10,
    bedType: 'King Bed',
    roomSize: '450 sq.ft',
    image: 'https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=800&q=80',
    amenities: ['Tea Garden View', 'Stone Fireplace', 'Complimentary Breakfast', 'Free Wi-Fi', 'Herbal Teas'],
    isActive: true
  },
  {
    hotelId: 'monsoon-grove',
    name: 'Plantation Estate Villa',
    description: 'Two-story private villa nestled in the cardamom grove with sweeping views of the Western Ghats.',
    price: 13200,
    capacity: 4,
    totalInventory: 5,
    bedType: 'King Bed + 2 Single Beds',
    roomSize: '850 sq.ft',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    amenities: ['Mountain View', 'Private Lawn', 'Kitchenette', 'Bonfire Pit', 'Nature Walk Guide'],
    isActive: true
  },

  // Bluewater Cove Resort (Havelock Island)
  {
    hotelId: 'bluewater-cove',
    name: 'Beachfront Bungalow',
    description: 'Barefoot luxury cottage steps away from turquoise waves, outdoor rain shower and hammock deck.',
    price: 11200,
    capacity: 2,
    totalInventory: 8,
    bedType: 'King Bed',
    roomSize: '520 sq.ft',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    amenities: ['Direct Beach Access', 'Open-air Shower', 'Private Hammock', 'Snorkel Kit', 'Sea Breeze Porch'],
    isActive: true
  },
  {
    hotelId: 'bluewater-cove',
    name: 'Coral Lagoon Chalet',
    description: 'Elevated timber chalet overlooking the coral reef lagoon with sunset terrace and glass-floor section.',
    price: 16800,
    capacity: 4,
    totalInventory: 4,
    bedType: '2 Queen Beds',
    roomSize: '780 sq.ft',
    image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
    amenities: ['Lagoon View', 'Glass Floor', 'Sunset Balcony', 'Free Breakfast', 'Complimentary Scuba Dive'],
    isActive: true
  },

  // Amber Courtyard Palace (Jaisalmer)
  {
    hotelId: 'amber-courtyard',
    name: 'Golden Sandstone Room',
    description: 'Warm sandstone sanctuary with traditional Rajasthani textiles, carved arches, and desert breeze.',
    price: 7600,
    capacity: 2,
    totalInventory: 10,
    bedType: 'King Bed',
    roomSize: '400 sq.ft',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    amenities: ['Fort View', 'Sandstone Decor', 'Free Wi-Fi', 'Air Conditioning', 'Traditional Welcome Drink'],
    isActive: true
  },
  {
    hotelId: 'amber-courtyard',
    name: 'Royal Thar Haveli Suite',
    description: 'Luxurious two-room suite with stained glass windows, brass bathtub, and private desert view sit-out.',
    price: 12500,
    capacity: 3,
    totalInventory: 5,
    bedType: 'King Bed + Daybed',
    roomSize: '700 sq.ft',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    amenities: ['Desert View', 'Brass Soaking Tub', 'Complimentary Desert Safari', 'Rooftop Dining Credit'],
    isActive: true
  },

  // Harborlight House (Kochi)
  {
    hotelId: 'harborlight-house',
    name: 'Heritage Waterfront Room',
    description: 'Colonial high-ceiling room featuring teak wood floors, antique writing desk, and views of harbor boats.',
    price: 6900,
    capacity: 2,
    totalInventory: 10,
    bedType: 'King Bed',
    roomSize: '390 sq.ft',
    image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80',
    amenities: ['Harbor View', 'Teak Wood Floors', 'Espresso Bar', 'Free Wi-Fi', 'Bicycle Access'],
    isActive: true
  },
  {
    hotelId: 'harborlight-house',
    name: 'Colonial Governor Suite',
    description: 'Historic executive suite with a deep sea-facing veranda, private library alcove, and bespoke afternoon tea.',
    price: 11800,
    capacity: 3,
    totalInventory: 4,
    bedType: 'Four-Poster King',
    roomSize: '650 sq.ft',
    image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
    amenities: ['Arabian Sea View', 'Private Veranda', 'Library Corner', 'Evening High Tea', 'Luxury Amenities'],
    isActive: true
  }
];

const OFFERS_DATA = [
  {
    code: 'STAYEASE10',
    name: 'Welcome Stay 10%',
    description: 'Enjoy 10% flat discount on your premier booking across any StayEase property.',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    startsAt: new Date('2026-01-01'),
    endsAt: new Date('2026-12-31'),
    hotelIds: [],
    isActive: true
  },
  {
    code: 'HERITAGE20',
    name: 'Royal Heritage Escapes',
    description: 'Exclusive 20% discount on heritage stays in Jaipur, Udaipur, and Jaisalmer.',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    startsAt: new Date('2026-02-01'),
    endsAt: new Date('2026-11-30'),
    hotelIds: ['haveli', 'lakehouse', 'amber-courtyard'],
    isActive: true
  },
  {
    code: 'BEACHVIBES',
    name: 'Coastal Retreat ₹2,500 Off',
    description: 'Flat ₹2,500 off on 3+ night bookings at beachfront properties in Goa & Havelock.',
    discountType: 'FIXED',
    discountValue: 2500,
    startsAt: new Date('2026-03-01'),
    endsAt: new Date('2026-10-31'),
    hotelIds: ['palm-house', 'bluewater-cove'],
    isActive: true
  }
];

async function seedMongoDB() {
  console.log('🚀 Connecting to MongoDB...');
  await mongoose.connect(`${MONGODB_HOST}/hotel_catalog`);
  console.log('✅ Connected to MongoDB.');

  const catalogDb = mongoose.connection.useDb('hotel_catalog');
  const housekeepingDb = mongoose.connection.useDb('hotel_housekeeping');
  const reviewsDb = mongoose.connection.useDb('hotel_reviews');

  // 1. Seed Hotels
  console.log('🏨 Seeding Hotels into hotel_catalog.hotels...');
  const hotelsCol = catalogDb.collection('hotels');
  for (const hotel of HOTELS_DATA) {
    await hotelsCol.updateOne(
      { slug: hotel.slug },
      { $set: { ...hotel, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  }
  const hotelsCount = await hotelsCol.countDocuments();
  console.log(`✅ Hotels seeded! Total in collection: ${hotelsCount}`);

  // Fetch updated hotels map to get both slugs and ObjectIds
  const allHotels = await hotelsCol.find({}).toArray();
  const hotelIdMap = new Map();
  for (const h of allHotels) {
    hotelIdMap.set(h.slug, h._id.toString());
  }

  // 2. Seed Rooms
  console.log('🛏️  Seeding Rooms into hotel_catalog.rooms...');
  const roomsCol = catalogDb.collection('rooms');
  for (const room of ROOMS_DATA) {
    await roomsCol.updateOne(
      { hotelId: room.hotelId, name: room.name },
      { $set: { ...room, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  }
  const roomsCount = await roomsCol.countDocuments();
  console.log(`✅ Rooms seeded! Total in collection: ${roomsCount}`);

  // 3. Seed Offers
  console.log('🏷️  Seeding Offers into hotel_catalog.offers...');
  const offersCol = catalogDb.collection('offers');
  for (const offer of OFFERS_DATA) {
    await offersCol.updateOne(
      { code: offer.code },
      { $set: { ...offer, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  }
  const offersCount = await offersCol.countDocuments();
  console.log(`✅ Offers seeded! Total in collection: ${offersCount}`);

  // 4. Seed Housekeeping Tasks
  console.log('🧹 Seeding Housekeeping Tasks into hotel_housekeeping.housekeepingtasks...');
  const hkCol = housekeepingDb.collection('housekeepingtasks');
  const hkTasks = [
    { hotelId: 'palm-house', roomNumber: '101', status: 'CLEAN', priority: 'NORMAL', taskType: 'STANDARD', guestName: 'Aarav Shah', taskDate: '2026-11-16', checklist: ['Change bed linen', 'Sanitize bath', 'Replenish mini-bar'], assignedTo: 'Pooja Menon' },
    { hotelId: 'palm-house', roomNumber: '102', status: 'IN_PROGRESS', priority: 'HIGH', taskType: 'DEEP_CLEAN', guestName: 'Mira Desai', taskDate: '2026-11-16', checklist: ['Steam carpets', 'Clean balcony plunge pool'], assignedTo: 'Dev Kumar' },
    { hotelId: 'palm-house', roomNumber: '201', status: 'DIRTY', priority: 'NORMAL', taskType: 'CHECKOUT', guestName: 'Rohan Malik', taskDate: '2026-11-16', checklist: ['Full turnover', 'Restock amenities'], assignedTo: 'Pooja Menon' },
    { hotelId: 'haveli', roomNumber: 'HR-101', status: 'INSPECTED', priority: 'HIGH', taskType: 'VIP_ARRIVAL', guestName: 'Sana Reddy', taskDate: '2026-11-16', checklist: ['Flower arrangement', 'Fruit basket setup', 'Check AC'], assignedTo: 'Karan Rao' },
    { hotelId: 'haveli', roomNumber: 'HR-102', status: 'CLEAN', priority: 'NORMAL', taskType: 'STANDARD', guestName: 'Kabir Sen', taskDate: '2026-11-16', checklist: ['Daily dusting', 'Towels change'], assignedTo: 'Dev Kumar' },
    { hotelId: 'lakehouse', roomNumber: 'LP-301', status: 'CLEAN', priority: 'HIGH', taskType: 'STANDARD', guestName: 'Ira Kulkarni', taskDate: '2026-11-16', checklist: ['Balcony sweep', 'Window glass polish'], assignedTo: 'Pooja Menon' },
    { hotelId: 'monsoon-grove', roomNumber: 'MV-01', status: 'CLEAN', priority: 'NORMAL', taskType: 'STANDARD', guestName: 'Neil Fernandes', taskDate: '2026-11-16', checklist: ['Fireplace wood restock', 'Heater check'], assignedTo: 'Karan Rao' },
    { hotelId: 'bluewater-cove', roomNumber: 'BW-05', status: 'DIRTY', priority: 'NORMAL', taskType: 'STANDARD', guestName: 'Pia Chopra', taskDate: '2026-11-16', checklist: ['Outdoor sand rinse', 'Towels wash'], assignedTo: 'Dev Kumar' },
  ];
  for (const t of hkTasks) {
    await hkCol.updateOne(
      { hotelId: t.hotelId, roomNumber: t.roomNumber, taskDate: t.taskDate },
      { $set: { ...t, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  }
  const hkCount = await hkCol.countDocuments();
  console.log(`✅ Housekeeping tasks seeded! Total: ${hkCount}`);

  // 5. Seed Reviews
  console.log('⭐ Seeding Reviews into hotel_reviews.reviews...');
  const revCol = reviewsDb.collection('reviews');
  const sampleReviews = [
    {
      hotelId: 'palm-house',
      userName: 'Aditi Sharma',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80',
      rating: 5,
      title: 'Unbelievable sunset and hospitality!',
      comment: 'The Ocean View Villa is purely magical. Plunge pool was pristine, food at the coastal bar was exceptional, and the staff made our anniversary truly unforgettable.',
      ratingsBreakdown: { cleanliness: 5, comfort: 5, location: 5, service: 5, valueForMoney: 5 },
      stayDate: new Date('2026-10-14'),
      verifiedBooking: true,
      helpfulCount: 42,
      isApproved: true,
      isHidden: false
    },
    {
      hotelId: 'palm-house',
      userName: 'Rahul Verma',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80',
      rating: 5,
      title: 'Best beach resort experience in Goa',
      comment: 'Candolim beach is a 2-minute stroll away. Breakfast spread was mouth-watering with fresh Goan poi and tropical fruits. Highly recommended!',
      ratingsBreakdown: { cleanliness: 5, comfort: 5, location: 5, service: 4, valueForMoney: 5 },
      stayDate: new Date('2026-10-28'),
      verifiedBooking: true,
      helpfulCount: 19,
      isApproved: true,
      isHidden: false
    },
    {
      hotelId: 'haveli',
      userName: 'Sunita Mehra',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
      rating: 5,
      title: 'Felt like royalty in Jaipur',
      comment: 'The architecture transports you back to the royal era. Courtyard evening music with puppet show was mesmerizing. Courtyard suite was enormous and luxurious.',
      ratingsBreakdown: { cleanliness: 5, comfort: 5, location: 5, service: 5, valueForMoney: 5 },
      stayDate: new Date('2026-10-05'),
      verifiedBooking: true,
      helpfulCount: 31,
      isApproved: true,
      isHidden: false
    },
    {
      hotelId: 'lakehouse',
      userName: 'Rohan Deshmukh',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80',
      rating: 5,
      title: 'Unmatched Lake Pichola views',
      comment: 'Waking up to Lake Pichola right outside our window was breathtaking. The boat arrival felt like a dream. Top-tier butler service.',
      ratingsBreakdown: { cleanliness: 5, comfort: 5, location: 5, service: 5, valueForMoney: 4 },
      stayDate: new Date('2026-11-02'),
      verifiedBooking: true,
      helpfulCount: 25,
      isApproved: true,
      isHidden: false
    },
    {
      hotelId: 'monsoon-grove',
      userName: 'Meera Nambiar',
      userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&q=80',
      rating: 5,
      title: 'Serene mountain peace in Munnar',
      comment: 'Surrounded by emerald green tea gardens. The stone fireplace in the room kept us cozy in the chilly mist. Authentic Kerala breakfast was fantastic.',
      ratingsBreakdown: { cleanliness: 5, comfort: 5, location: 5, service: 5, valueForMoney: 5 },
      stayDate: new Date('2026-09-20'),
      verifiedBooking: true,
      helpfulCount: 15,
      isApproved: true,
      isHidden: false
    }
  ];
  for (const r of sampleReviews) {
    await revCol.updateOne(
      { hotelId: r.hotelId, userName: r.userName },
      { $set: { ...r, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  }
  const revCount = await revCol.countDocuments();
  console.log(`✅ Reviews seeded! Total: ${revCount}`);

  await mongoose.disconnect();
  console.log('✨ MongoDB Seeding Complete!');
}

seedMongoDB().catch((err) => {
  console.error('❌ MongoDB seed failed:', err);
  process.exit(1);
});
