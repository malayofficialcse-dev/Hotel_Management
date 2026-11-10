import { hotels, roomTypes } from "@/lib/data";

export type AdminSection =
  | "dashboard"
  | "hotels"
  | "rooms"
  | "reservations"
  | "customers"
  | "departments"
  | "employees"
  | "roles"
  | "payments"
  | "offers"
  | "reviews"
  | "reports"
  | "notifications"
  | "audit"
  | "settings";

export type AdminRecord = {
  id: string;
  name: string;
  detail: string;
  status: string;
  value: string;
  date: string;
};

export const adminNavigation: { id: AdminSection; label: string; group?: string }[] = [
  { id: "dashboard", label: "Dashboard", group: "WORKSPACE" },
  { id: "hotels", label: "Hotels" },
  { id: "rooms", label: "Rooms" },
  { id: "reservations", label: "Reservations" },
  { id: "customers", label: "Customers" },
  { id: "departments", label: "Departments" },
  { id: "employees", label: "Employees" },
  { id: "roles", label: "Roles & Permissions (RBAC)" },
  { id: "payments", label: "Payments" },
  { id: "offers", label: "Offers" },
  { id: "reviews", label: "Reviews" },
  { id: "reports", label: "Reports", group: "INSIGHTS" },
  { id: "notifications", label: "Notifications", group: "SYSTEM" },
  { id: "audit", label: "Audit log" },
  { id: "settings", label: "Settings" },
];

export const sectionTitles: Record<AdminSection, { title: string; subtitle: string; action: string }> = {
  dashboard: { title: "Dashboard", subtitle: "A good day starts with a clear view.", action: "View reports" },
  hotels: { title: "Hotels", subtitle: "Your properties, connected.", action: "Add property" },
  rooms: { title: "Rooms", subtitle: "Every room, ready for its next guest.", action: "Add room" },
  reservations: { title: "Reservations", subtitle: "From first confirmation to final checkout, keep every stay on track.", action: "New reservation" },
  customers: { title: "Customers", subtitle: "Know the people behind every stay.", action: "Add customer" },
  departments: { title: "Departments", subtitle: "Great stays start with great teams.", action: "Add department" },
  employees: { title: "Employees", subtitle: "Your people, in the right places.", action: "Add employee" },
  roles: { title: "Roles & permissions", subtitle: "Set clear access for every team member.", action: "Create role" },
  payments: { title: "Payments", subtitle: "Track transactions, payouts, and refunds.", action: "Export payments" },
  offers: { title: "Offers", subtitle: "Thoughtful offers for memorable stays.", action: "Create offer" },
  reviews: { title: "Reviews", subtitle: "Every guest voice, all in one place.", action: "View feedback" },
  reports: { title: "Reports", subtitle: "Understand performance across your portfolio.", action: "Export report" },
  notifications: { title: "Notifications", subtitle: "Important updates from across your workspace.", action: "Mark all read" },
  audit: { title: "Audit log", subtitle: "A transparent history of workspace activity.", action: "Export log" },
  settings: { title: "Settings", subtitle: "Configure your portfolio workspace.", action: "Save changes" },
};

const dates = ["Nov 08, 2026", "Nov 07, 2026", "Nov 06, 2026", "Nov 05, 2026"];

export const sectionRecords: Partial<Record<AdminSection, AdminRecord[]>> = {
  hotels: hotels.map((hotel, index) => ({
    id: `HT-${String(index + 1).padStart(3, "0")}`,
    name: hotel.name,
    detail: hotel.location,
    status: index === 4 ? "Review" : "Active",
    value: `${hotel.rating} / 5`,
    date: dates[index % dates.length],
  })),
  rooms: roomTypes.map((room, index) => ({
    id: `RM-${String(201 + index).padStart(3, "0")}`,
    name: room.name,
    detail: room.beds,
    status: index === 2 ? "Maintenance" : index === 1 ? "Occupied" : "Available",
    value: `₹${room.price.toLocaleString("en-IN")} / night`,
    date: dates[index % dates.length],
  })),
  reservations: [
    ["SE-261108-0482", "Aarav Mehta", "The Palm House · Deluxe room", "Confirmed", "₹24,480", "Nov 08, 2026"],
    ["SE-261108-0479", "Maya Kapoor", "Haveli & Co. · Heritage double", "Checked in", "₹14,560", "Nov 08, 2026"],
    ["SE-261107-0464", "Ishaan Shah", "Lakehouse Retreat · Lake suite", "Pending", "₹36,800", "Nov 07, 2026"],
    ["SE-261107-0458", "Diya Nair", "The Green Canopy · Garden room", "Checked out", "₹18,200", "Nov 07, 2026"],
    ["SE-261106-0431", "Kabir Rao", "The Marine Collective · Ocean view", "Cancelled", "₹19,200", "Nov 06, 2026"],
    ["SE-261105-0402", "Anaya Sen", "River & Root · Riverside room", "Confirmed", "₹11,600", "Nov 05, 2026"],
  ].map(([id, name, detail, status, value, date]) => ({ id, name, detail, status, value, date })),
  customers: [
    ["CU-10482", "Aarav Mehta", "aarav.mehta@email.com", "Returning", "8 stays", "Nov 08, 2026"],
    ["CU-10479", "Maya Kapoor", "maya.k@email.com", "VIP", "12 stays", "Nov 08, 2026"],
    ["CU-10464", "Ishaan Shah", "ishaan.s@email.com", "New", "1 stay", "Nov 07, 2026"],
    ["CU-10458", "Diya Nair", "diya.nair@email.com", "Returning", "4 stays", "Nov 07, 2026"],
    ["CU-10431", "Kabir Rao", "kabir.rao@email.com", "Returning", "3 stays", "Nov 06, 2026"],
  ].map(([id, name, detail, status, value, date]) => ({ id, name, detail, status, value, date })),
  departments: [
    ["DP-01", "Front desk", "Guest services", "Active", "32 members", "Nov 08, 2026"],
    ["DP-02", "Housekeeping", "Property operations", "Active", "48 members", "Nov 08, 2026"],
    ["DP-03", "Reservations", "Guest services", "Active", "18 members", "Nov 07, 2026"],
    ["DP-04", "Food & beverage", "Property operations", "Active", "26 members", "Nov 06, 2026"],
    ["DP-05", "Finance", "Business operations", "Active", "12 members", "Nov 05, 2026"],
  ].map(([id, name, detail, status, value, date]) => ({ id, name, detail, status, value, date })),
  employees: [
    ["EM-2081", "Sarah Mitchell", "Front desk · The Palm House", "Active", "Property manager", "Nov 08, 2026"],
    ["EM-2074", "Rohan Desai", "Housekeeping · Haveli & Co.", "Active", "Team lead", "Nov 08, 2026"],
    ["EM-2068", "Priya Menon", "Reservations · Portfolio", "On leave", "Reservations agent", "Nov 07, 2026"],
    ["EM-2059", "Neil Fernandes", "Finance · Portfolio", "Active", "Finance manager", "Nov 06, 2026"],
    ["EM-2042", "Aditi Sharma", "Guest services · Lakehouse", "Active", "Guest experience", "Nov 05, 2026"],
  ].map(([id, name, detail, status, value, date]) => ({ id, name, detail, status, value, date })),
  roles: [
    ["RL-01", "Administrator", "Full workspace access", "Active", "4 members", "Nov 08, 2026"],
    ["RL-02", "Property manager", "Assigned property access", "Active", "12 members", "Nov 08, 2026"],
    ["RL-03", "Front desk", "Reservations and guest services", "Active", "32 members", "Nov 07, 2026"],
    ["RL-04", "Finance", "Payments and reports", "Active", "8 members", "Nov 06, 2026"],
  ].map(([id, name, detail, status, value, date]) => ({ id, name, detail, status, value, date })),
  payments: [
    ["PY-80231", "Aarav Mehta", "The Palm House · SE-261108-0482", "Paid", "₹24,480", "Nov 08, 2026"],
    ["PY-80228", "Maya Kapoor", "Haveli & Co. · SE-261108-0479", "Paid", "₹14,560", "Nov 08, 2026"],
    ["PY-80194", "Ishaan Shah", "Lakehouse Retreat · SE-261107-0464", "Pending", "₹36,800", "Nov 07, 2026"],
    ["PY-80153", "Kabir Rao", "The Marine Collective · Refund", "Refunded", "₹19,200", "Nov 06, 2026"],
  ].map(([id, name, detail, status, value, date]) => ({ id, name, detail, status, value, date })),
  offers: [
    ["OF-201", "A little longer, 15% off", "3+ night stays · All properties", "Active", "15% off", "Nov 08, 2026"],
    ["OF-198", "First stay, on us", "New guests · Selected hotels", "Active", "10% off", "Nov 07, 2026"],
    ["OF-192", "A slower Sunday", "Weekend stays · Goa", "Scheduled", "Breakfast", "Nov 06, 2026"],
    ["OF-184", "Monsoon memories", "All guests · Coorg", "Expired", "₹1,000 off", "Nov 05, 2026"],
  ].map(([id, name, detail, status, value, date]) => ({ id, name, detail, status, value, date })),
  reviews: [
    ["RV-5831", "Maya Kapoor", "Haveli & Co. · “Thoughtful in every detail.”", "Published", "5.0 / 5", "Nov 08, 2026"],
    ["RV-5824", "Aarav Mehta", "The Palm House · “A lovely coastal escape.”", "Published", "4.8 / 5", "Nov 07, 2026"],
    ["RV-5809", "Ishaan Shah", "Lakehouse Retreat · “Beautiful lake views.”", "Needs reply", "4.6 / 5", "Nov 07, 2026"],
    ["RV-5792", "Kabir Rao", "The Marine Collective · “Wonderful location.”", "Flagged", "3.2 / 5", "Nov 06, 2026"],
  ].map(([id, name, detail, status, value, date]) => ({ id, name, detail, status, value, date })),
  notifications: [
    ["NT-401", "New reservation received", "Aarav Mehta · The Palm House · SE-261108-0482", "Unread", "Today, 10:42 AM", "Nov 08, 2026"],
    ["NT-398", "Payment settled", "₹14,560 payment for reservation SE-261108-0479", "Unread", "Today, 9:18 AM", "Nov 08, 2026"],
    ["NT-391", "Review needs a reply", "Ishaan Shah left a review for Lakehouse Retreat", "Read", "Yesterday, 4:32 PM", "Nov 07, 2026"],
    ["NT-384", "Room needs attention", "Deluxe room · The Palm House · Maintenance request", "Read", "Yesterday, 1:15 PM", "Nov 07, 2026"],
  ].map(([id, name, detail, status, value, date]) => ({ id, name, detail, status, value, date })),
  audit: [
    ["AU-20841", "Sarah Mitchell", "Updated room availability · The Palm House", "Completed", "Rooms", "Today, 10:14 AM"],
    ["AU-20838", "Rohan Desai", "Checked in Maya Kapoor · SE-261108-0479", "Completed", "Reservations", "Today, 9:44 AM"],
    ["AU-20829", "Neil Fernandes", "Issued refund · PY-80153", "Completed", "Payments", "Yesterday, 4:28 PM"],
    ["AU-20814", "Sarah Mitchell", "Changed front desk role permissions", "Completed", "Access", "Yesterday, 2:05 PM"],
  ].map(([id, name, detail, status, value, date]) => ({ id, name, detail, status, value, date })),
};

export const sectionTabs: Partial<Record<AdminSection, string[]>> = {
  reservations: ["All bookings", "Arrivals today", "In-house", "Departures", "Pending approval (6)"],
  rooms: ["All rooms", "Available", "Occupied", "Needs attention"],
  customers: ["All customers", "Returning", "VIP", "New this month"],
  payments: ["All payments", "Settled", "Pending", "Refunds"],
  reviews: ["All reviews", "Needs reply", "Published", "Flagged"],
};

export const statCards: Record<AdminSection, { label: string; value: string; note: string }[]> = {
  dashboard: [
    { label: "Properties", value: "06", note: "Across 5 destinations" },
    { label: "Rooms available", value: "480", note: "78.5% occupancy" },
    { label: "Reservations", value: "1,284", note: "+8.2% vs. September" },
    { label: "Revenue", value: "₹89.4L", note: "This month" },
    { label: "New customers", value: "3,842", note: "+12.4% this month" },
    { label: "Guest rating", value: "4.8 / 5", note: "Across 1,426 reviews" },
  ],
  hotels: [
    { label: "Properties", value: "06", note: "Across 5 destinations" },
    { label: "Active", value: "05", note: "Accepting reservations" },
    { label: "Rooms", value: "480", note: "Across your portfolio" },
    { label: "Avg. rating", value: "4.8 / 5", note: "From recent guests" },
  ],
  rooms: [
    { label: "Total rooms", value: "480", note: "Across 6 properties" },
    { label: "Available", value: "377", note: "Ready for check-in" },
    { label: "Occupied", value: "91", note: "19% of all rooms" },
    { label: "Needs attention", value: "12", note: "Maintenance or review" },
  ],
  reservations: [
    { label: "October bookings", value: "1,284", note: "+8.2% vs. September" },
    { label: "Arrivals today", value: "32", note: "18 rooms ready for check-in" },
    { label: "Departures today", value: "28", note: "8 guests checked out" },
    { label: "Pending approval", value: "06", note: "Need manager approval" },
  ],
  customers: [
    { label: "Total customers", value: "3,842", note: "+12.4% this month" },
    { label: "Returning guests", value: "1,426", note: "37% of your community" },
    { label: "New this month", value: "486", note: "Across all properties" },
    { label: "Guest rating", value: "4.8 / 5", note: "From 1,426 reviews" },
  ],
  departments: [
    { label: "Departments", value: "08", note: "Across the portfolio" },
    { label: "Team members", value: "142", note: "Across all properties" },
    { label: "Open positions", value: "06", note: "3 awaiting review" },
    { label: "Engagement", value: "94%", note: "Team health score" },
  ],
  employees: [
    { label: "Team members", value: "142", note: "Across all properties" },
    { label: "Active today", value: "118", note: "On shift across 6 stays" },
    { label: "On leave", value: "08", note: "Across 4 departments" },
    { label: "Open positions", value: "06", note: "3 applications received" },
  ],
  roles: [
    { label: "Roles", value: "08", note: "4 system · 4 custom" },
    { label: "Team members", value: "142", note: "Access managed centrally" },
    { label: "Admins", value: "04", note: "Full workspace access" },
    { label: "Recent changes", value: "12", note: "In the last 30 days" },
  ],
  payments: [
    { label: "Collected this month", value: "₹89.4L", note: "+8.2% vs. September" },
    { label: "Settled", value: "₹76.2L", note: "85% of collections" },
    { label: "Pending", value: "₹8.4L", note: "32 transactions" },
    { label: "Refunds", value: "₹4.8L", note: "18 transactions" },
  ],
  offers: [
    { label: "Active offers", value: "08", note: "Across 5 properties" },
    { label: "Redemptions", value: "486", note: "This month" },
    { label: "Revenue influenced", value: "₹12.8L", note: "From offer bookings" },
    { label: "Scheduled", value: "03", note: "Coming up this month" },
  ],
  reviews: [
    { label: "Guest reviews", value: "1,426", note: "Across all properties" },
    { label: "Average rating", value: "4.8 / 5", note: "A lovely guest sentiment" },
    { label: "Needs a reply", value: "06", note: "Your guests are waiting" },
    { label: "Published", value: "98%", note: "Community guidelines" },
  ],
  reports: [
    { label: "Portfolio revenue", value: "₹89.4L", note: "October 2026" },
    { label: "Occupancy", value: "78.5%", note: "+4.2% vs. September" },
    { label: "Average daily rate", value: "₹7,850", note: "+2.8% year over year" },
    { label: "RevPAR", value: "₹6,162", note: "+6.1% year over year" },
  ],
  notifications: [
    { label: "All updates", value: "18", note: "Across your workspace" },
    { label: "Unread", value: "02", note: "Needs your attention" },
    { label: "Reservations", value: "08", note: "Recent booking activity" },
    { label: "Operations", value: "04", note: "Property updates" },
  ],
  audit: [
    { label: "Events this month", value: "2,084", note: "Across all properties" },
    { label: "Team members", value: "142", note: "Workspace activity" },
    { label: "Security events", value: "08", note: "No issues detected" },
    { label: "Last synced", value: "09:42", note: "Today, local time" },
  ],
  settings: [
    { label: "Properties", value: "06", note: "Connected to workspace" },
    { label: "Team members", value: "142", note: "Across your portfolio" },
    { label: "Workspace health", value: "Good", note: "All systems operational" },
    { label: "Last synced", value: "09:42", note: "Today, local time" },
  ],
};

