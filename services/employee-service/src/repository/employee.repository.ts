import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../models/department.dto';
import { Employee } from '@prisma/client';

@Injectable()
export class EmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filters: { departmentId?: string; isActive?: boolean } = {},
  ): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: {
        ...(filters.departmentId && { departmentId: filters.departmentId }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      },
      include: {
        department: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        tasks: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { createdAt: 'desc' },
        },
        schedules: {
          where: {
            date: { gte: new Date() },
          },
          orderBy: { date: 'asc' },
          take: 7,
        },
      },
    });
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: { userId },
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async findOrThrow(id: string): Promise<Employee> {
    const employee = await this.findById(id);
    if (!employee) {
      throw new NotFoundException(`Employee with id "${id}" not found`);
    }
    return employee;
  }

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    return this.prisma.employee.create({
      data: {
        userId: dto.userId,
        departmentId: dto.departmentId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        position: dto.position,
        joiningDate: new Date(dto.joiningDate),
        salary: dto.salary,
      },
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    await this.findOrThrow(id);
    return this.prisma.employee.update({
      where: { id },
      data: {
        ...(dto.departmentId && { departmentId: dto.departmentId }),
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.position && { position: dto.position }),
        ...(dto.joiningDate && { joiningDate: new Date(dto.joiningDate) }),
        ...(dto.salary !== undefined && { salary: dto.salary }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async delete(id: string): Promise<Employee> {
    await this.findOrThrow(id);
    // Soft delete — set isActive to false
    return this.prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findByDepartment(departmentId: string): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: { departmentId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
