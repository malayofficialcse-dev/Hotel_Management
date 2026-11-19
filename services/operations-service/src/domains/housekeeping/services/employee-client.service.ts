import { prisma } from "../../employee/config/database.js";

export async function requireEmployee(id: string) {
  const employee = await prisma.employee.findUnique({ where: { id }, select: { id: true, isActive: true } });
  if (!employee || !employee.isActive) throw new Error("Employee not found");
}
