export interface EmployeeInput {
  userId?: string;
  employeeCode?: string;
  hotelId?: string;
  hotelName?: string;
  departmentId: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  joiningDate: string;
  salary?: number | null;
}

export const employeeFields = [
  "userId",
  "employeeCode",
  "hotelId",
  "hotelName",
  "departmentId",
  "name",
  "email",
  "phone",
  "position",
  "joiningDate",
  "salary",
  "isActive",
] as const;
