export const EMPLOYEE_ROUTES = {
  BASE: "/api/v1/employees",
  HEALTH: "/api/v1/employees/health",
  LIST: "/api/v1/employees",
  CREATE: "/api/v1/employees",
  DEPARTMENTS: "/api/v1/employees/departments",
  BY_ID: "/api/v1/employees/:id",
  TASKS: "/api/v1/employees/tasks",
  SCHEDULES: "/api/v1/employees/schedules",
} as const;

export type EmployeeRoutes = typeof EMPLOYEE_ROUTES;

