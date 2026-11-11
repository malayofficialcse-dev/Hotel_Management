import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { EmployeeService } from "../services/employee.service.js";

@Controller("api/v1/employees")
export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  @Get("health")
  healthCheck() {
    return { status: "UP", service: "employee-service", engine: "NestJS + PostgreSQL (Prisma)", port: 8007 };
  }

  @Get("departments")
  getDepartments() {
    return this.service.getDepartments();
  }

  @Get()
  getEmployees(@Query("departmentId") departmentId?: string) {
    return this.service.getEmployees(departmentId);
  }

  @Post()
  createEmployee(@Body() body: any) {
    return this.service.createEmployee(body);
  }
}

