import { prisma } from "../config/database.js";

export class EmployeeRepository {
  list(departmentId?: string) {
    return prisma.employee.findMany({
      where: {
        isActive: true,
        ...(departmentId ? { departmentId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string) {
    return prisma.employee.findUnique({ where: { id } });
  }

  create(data: {
    userId: string;
    departmentId: string;
    name: string;
    email: string;
    phone?: string;
    position: string;
    joiningDate: Date;
    salary?: number | null;
  }) {
    return prisma.employee.create({ data });
  }

  update(id: string, data: Record<string, unknown>) {
    return prisma.employee.update({ where: { id }, data });
  }

  deactivate(id: string) {
    return prisma.employee.update({ where: { id }, data: { isActive: false } });
  }
}
