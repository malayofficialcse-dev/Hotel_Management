export type AdminModule =
  | "dashboard"
  | "hotels"
  | "rooms"
  | "reservations"
  | "customers"
  | "departments"
  | "employees"
  | "housekeeping"
  | "roles"
  | "payments"
  | "offers"
  | "reviews"
  | "reports";

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type PermissionMatrix = Record<AdminModule, ModulePermission>;

export const ADMIN_MODULES: { id: AdminModule; label: string; description: string }[] = [
  { id: "dashboard", label: "Dashboard", description: "Workspace statistics, KPI overviews and activity" },
  { id: "hotels", label: "Hotels", description: "Hotel properties, locations, and catalog details" },
  { id: "rooms", label: "Rooms", description: "Room inventory, pricing, amenities, and types" },
  { id: "reservations", label: "Reservations", description: "Guest bookings, stay dates, and occupancy" },
  { id: "customers", label: "Customers", description: "Guest directory and contact profiles" },
  { id: "departments", label: "Departments", description: "Department structure and property assignments" },
  { id: "employees", label: "Employees", description: "Staff directory, salaries, roles, and profiles" },
  { id: "housekeeping", label: "Housekeeping", description: "Cleaning tasks, room status, and staff dispatch" },
  { id: "roles", label: "Roles & Permissions", description: "Access control, RBAC policies, and staff privileges" },
  { id: "payments", label: "Payments", description: "Checkout transactions, revenue logs, and refunds" },
  { id: "offers", label: "Offers", description: "Discounts, promotional codes, and package deals" },
  { id: "reviews", label: "Reviews", description: "Guest ratings, testimonials, and review moderation" },
  { id: "reports", label: "Reports", description: "Financial audits and reservation data summaries" },
];

export const FULL_PERMISSIONS: PermissionMatrix = {
  dashboard: { view: true, create: true, edit: true, delete: true },
  hotels: { view: true, create: true, edit: true, delete: true },
  rooms: { view: true, create: true, edit: true, delete: true },
  reservations: { view: true, create: true, edit: true, delete: true },
  customers: { view: true, create: true, edit: true, delete: true },
  departments: { view: true, create: true, edit: true, delete: true },
  employees: { view: true, create: true, edit: true, delete: true },
  housekeeping: { view: true, create: true, edit: true, delete: true },
  roles: { view: true, create: true, edit: true, delete: true },
  payments: { view: true, create: true, edit: true, delete: true },
  offers: { view: true, create: true, edit: true, delete: true },
  reviews: { view: true, create: true, edit: true, delete: true },
  reports: { view: true, create: true, edit: true, delete: true },
};

export const NO_PERMISSIONS: PermissionMatrix = {
  dashboard: { view: false, create: false, edit: false, delete: false },
  hotels: { view: false, create: false, edit: false, delete: false },
  rooms: { view: false, create: false, edit: false, delete: false },
  reservations: { view: false, create: false, edit: false, delete: false },
  customers: { view: false, create: false, edit: false, delete: false },
  departments: { view: false, create: false, edit: false, delete: false },
  employees: { view: false, create: false, edit: false, delete: false },
  housekeeping: { view: false, create: false, edit: false, delete: false },
  roles: { view: false, create: false, edit: false, delete: false },
  payments: { view: false, create: false, edit: false, delete: false },
  offers: { view: false, create: false, edit: false, delete: false },
  reviews: { view: false, create: false, edit: false, delete: false },
  reports: { view: false, create: false, edit: false, delete: false },
};

export const ROLE_PRESETS: Record<string, { label: string; description: string; permissions: PermissionMatrix }> = {
  ADMIN: {
    label: "Administrator",
    description: "Full unconstrained administrative rights across all modules and actions.",
    permissions: FULL_PERMISSIONS,
  },
  HOTEL_MANAGER: {
    label: "Hotel Manager",
    description: "Full management of hotel operations, inventory, and staff without financial deletions.",
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      hotels: { view: true, create: true, edit: true, delete: false },
      rooms: { view: true, create: true, edit: true, delete: true },
      reservations: { view: true, create: true, edit: true, delete: false },
      customers: { view: true, create: true, edit: true, delete: false },
      departments: { view: true, create: true, edit: true, delete: false },
      employees: { view: true, create: true, edit: true, delete: false },
      housekeeping: { view: true, create: true, edit: true, delete: true },
      roles: { view: true, create: false, edit: false, delete: false },
      payments: { view: true, create: false, edit: false, delete: false },
      offers: { view: true, create: true, edit: true, delete: true },
      reviews: { view: true, create: false, edit: true, delete: false },
      reports: { view: true, create: false, edit: false, delete: false },
    },
  },
  FRONT_DESK: {
    label: "Front Desk Executive",
    description: "Check-in/out guests, create bookings, view room availability.",
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      hotels: { view: true, create: false, edit: false, delete: false },
      rooms: { view: true, create: false, edit: false, delete: false },
      reservations: { view: true, create: true, edit: true, delete: false },
      customers: { view: true, create: true, edit: true, delete: false },
      departments: { view: false, create: false, edit: false, delete: false },
      employees: { view: false, create: false, edit: false, delete: false },
      housekeeping: { view: true, create: true, edit: true, delete: false },
      roles: { view: false, create: false, edit: false, delete: false },
      payments: { view: true, create: true, edit: false, delete: false },
      offers: { view: true, create: false, edit: false, delete: false },
      reviews: { view: true, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
    },
  },
  HOUSEKEEPING_SUPERVISOR: {
    label: "Housekeeping Supervisor",
    description: "Manage room cleanliness, dispatch housekeeping staff, advance room status.",
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      hotels: { view: true, create: false, edit: false, delete: false },
      rooms: { view: true, create: false, edit: true, delete: false },
      reservations: { view: true, create: false, edit: false, delete: false },
      customers: { view: false, create: false, edit: false, delete: false },
      departments: { view: false, create: false, edit: false, delete: false },
      employees: { view: false, create: false, edit: false, delete: false },
      housekeeping: { view: true, create: true, edit: true, delete: true },
      roles: { view: false, create: false, edit: false, delete: false },
      payments: { view: false, create: false, edit: false, delete: false },
      offers: { view: false, create: false, edit: false, delete: false },
      reviews: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
    },
  },
  STAFF: {
    label: "General Staff / Associate",
    description: "Restricted workspace access for task updates and room cleaning logs.",
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      hotels: { view: false, create: false, edit: false, delete: false },
      rooms: { view: true, create: false, edit: false, delete: false },
      reservations: { view: false, create: false, edit: false, delete: false },
      customers: { view: false, create: false, edit: false, delete: false },
      departments: { view: false, create: false, edit: false, delete: false },
      employees: { view: false, create: false, edit: false, delete: false },
      housekeeping: { view: true, create: false, edit: true, delete: false },
      roles: { view: false, create: false, edit: false, delete: false },
      payments: { view: false, create: false, edit: false, delete: false },
      offers: { view: false, create: false, edit: false, delete: false },
      reviews: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
    },
  },
  AUDITOR: {
    label: "Auditor / Accountant",
    description: "Financial review and reports audit access without operational modification.",
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      hotels: { view: true, create: false, edit: false, delete: false },
      rooms: { view: true, create: false, edit: false, delete: false },
      reservations: { view: true, create: false, edit: false, delete: false },
      customers: { view: true, create: false, edit: false, delete: false },
      departments: { view: true, create: false, edit: false, delete: false },
      employees: { view: true, create: false, edit: false, delete: false },
      housekeeping: { view: false, create: false, edit: false, delete: false },
      roles: { view: false, create: false, edit: false, delete: false },
      payments: { view: true, create: false, edit: false, delete: false },
      offers: { view: true, create: false, edit: false, delete: false },
      reviews: { view: true, create: false, edit: false, delete: false },
      reports: { view: true, create: false, edit: false, delete: false },
    },
  },
};

const STORAGE_KEY = "stayease_rbac_permissions_v1";

/**
 * Returns stored custom permissions map keyed by employeeId or email.
 */
export function getSavedPermissionsMap(): Record<string, { role: string; matrix: PermissionMatrix }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Persists an employee's permission configuration in local cache as well.
 */
export function savePermissionsLocally(identifier: string, role: string, matrix: PermissionMatrix) {
  if (typeof window === "undefined") return;
  try {
    const current = getSavedPermissionsMap();
    current[identifier] = { role, matrix };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event("stayease-rbac-updated"));
  } catch {
    // ignore
  }
}

/**
 * Resolves effective permissions for the current user session.
 */
export function getEffectivePermissions(
  user: { email?: string; id?: string; role?: string } | null,
  employeeRecord?: { role?: string; permissions?: Record<string, any> | null } | null
): PermissionMatrix {
  // If user is top-level ADMIN, grant full access
  if (user?.role === "ADMIN" || user?.email?.toLowerCase().includes("admin")) {
    return FULL_PERMISSIONS;
  }

  // If passed directly from employeeRecord
  if (employeeRecord?.permissions && typeof employeeRecord.permissions === "object") {
    return { ...NO_PERMISSIONS, ...(employeeRecord.permissions as PermissionMatrix) };
  }

  if (employeeRecord?.role && ROLE_PRESETS[employeeRecord.role]) {
    return ROLE_PRESETS[employeeRecord.role].permissions;
  }

  // Look up in local storage cache by email or id
  if (typeof window !== "undefined" && user) {
    const saved = getSavedPermissionsMap();
    const match = (user.email && saved[user.email.toLowerCase()]) || (user.id && saved[user.id]);
    if (match) {
      return match.matrix;
    }
  }

  // Default fallback for staff/logged in user
  return ROLE_PRESETS.HOTEL_MANAGER.permissions;
}

/**
 * Helper to count how many modules are accessible for an employee.
 */
export function countAllowedModules(matrix?: PermissionMatrix | null): number {
  if (!matrix) return ADMIN_MODULES.length;
  return Object.values(matrix).filter((m) => m && m.view).length;
}
