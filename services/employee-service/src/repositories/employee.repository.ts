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

  findById(idOrCode: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    if (isUuid) {
      return prisma.employee.findUnique({ where: { id: idOrCode } });
    }
    return prisma.employee.findUnique({ where: { employeeCode: idOrCode } });
  }

  countByPrefixOrHotel(prefix: string, hotelId?: string) {
    return prisma.employee.count({
      where: {
        OR: [
          { employeeCode: { startsWith: prefix } },
          ...(hotelId ? [{ hotelId }] : []),
        ],
      },
    });
  }

  create(data: {
    userId: string;
    employeeCode?: string;
    hotelId?: string;
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

  update(idOrCode: string, data: Record<string, unknown>) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    if (isUuid) {
      return prisma.employee.update({ where: { id: idOrCode }, data });
    }
    return prisma.employee.update({ where: { employeeCode: idOrCode }, data });
  }

  deactivate(idOrCode: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    if (isUuid) {
      return prisma.employee.update({ where: { id: idOrCode }, data: { isActive: false } });
    }
    return prisma.employee.update({ where: { employeeCode: idOrCode }, data: { isActive: false } });
  }
}
