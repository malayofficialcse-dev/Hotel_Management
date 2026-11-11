import { Injectable } from "@nestjs/common";
import { EmployeeRepository } from "../repository/employee.repository.js";
import { DepartmentRepository } from "../repository/department.repository.js";

@Injectable()
export class EmployeeService {
  constructor(
    private readonly empRepo: EmployeeRepository,
    private readonly deptRepo: DepartmentRepository,
  ) {}

  async getDepartments() {
    return this.deptRepo.findAll();
  }

  async getEmployees(departmentId?: string) {
    if (departmentId) {
      return this.empRepo.findByDepartment(departmentId);
    }
    return this.empRepo.findAll();
  }

  async createEmployee(data: any) {
    return this.empRepo.create(data);
  }
}

