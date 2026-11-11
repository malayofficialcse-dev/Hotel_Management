export interface Department {
  id: string;
  name: string;
  hotelId: string;
  description?: string | null;
  headId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  userId: string;
  departmentId: string;
  name: string;
  email: string;
  phone?: string | null;
  position: string;
  joiningDate: Date;
  salary?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  departmentId: string;
  assigneeId?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Schedule {
  id: string;
  employeeId: string;
  date: Date;
  shiftStart: string;
  shiftEnd: string;
  shiftType: ShiftType;
  notes?: string | null;
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ShiftType {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  NIGHT = 'NIGHT',
}

export enum DepartmentName {
  FRONT_DESK = 'Front Desk',
  HOUSEKEEPING = 'Housekeeping',
  KITCHEN = 'Kitchen',
  MAINTENANCE = 'Maintenance',
  SECURITY = 'Security',
  FB = 'F&B',
  CONCIERGE = 'Concierge',
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  hotelId?: string;
}
