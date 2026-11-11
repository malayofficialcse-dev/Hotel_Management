import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from '../models/department.dto';
import { Department } from '@prisma/client';

@Injectable()
export class DepartmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(hotelId?: string): Promise<Department[]> {
    return this.prisma.department.findMany({
      where: hotelId ? { hotelId } : undefined,
      include: {
        employees: {
          where: { isActive: true },
          select: { id: true, name: true, position: true, email: true },
        },
        _count: { select: { tasks: true, employees: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Department | null> {
    return this.prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            position: true,
            email: true,
            phone: true,
            joiningDate: true,
          },
        },
        tasks: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async findOrThrow(id: string): Promise<Department> {
    const department = await this.findById(id);
    if (!department) {
      throw new NotFoundException(`Department with id "${id}" not found`);
    }
    return department;
  }

  async create(dto: CreateDepartmentDto): Promise<Department> {
    return this.prisma.department.create({
      data: {
        name: dto.name,
        hotelId: dto.hotelId,
        description: dto.description,
        headId: dto.headId,
      },
    });
  }

  async update(id: string, dto: UpdateDepartmentDto): Promise<Department> {
    await this.findOrThrow(id);
    return this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.headId !== undefined && { headId: dto.headId }),
      },
    });
  }

  async delete(id: string): Promise<Department> {
    await this.findOrThrow(id);
    return this.prisma.department.delete({ where: { id } });
  }
}
