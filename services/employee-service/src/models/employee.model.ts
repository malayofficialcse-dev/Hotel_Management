export interface EmployeeInput {
  userId: string;
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
  "departmentId",
  "name",
  "email",
  "phone",
  "position",
  "joiningDate",
  "salary",
  "isActive",
] as const;
