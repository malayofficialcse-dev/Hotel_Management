import type { Request, Response } from "express";
import { status as grpcStatus } from "@grpc/grpc-js";
import { EmployeeService } from "../services/employee.service.js";

const service = new EmployeeService();

function dependencyStatus(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) return 400;
  return error.code === grpcStatus.UNAVAILABLE || error.code === grpcStatus.DEADLINE_EXCEEDED ? 503 : 400;
}

export class EmployeeController {
  async list(req: Request, res: Response) {
    res.json(await service.list(typeof req.query.departmentId === "string" ? req.query.departmentId : undefined));
  }

  async departments(_req: Request, res: Response) {
    res.json(await service.listDepartments());
  }

  async get(req: Request, res: Response) {
    const employee = await service.get(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    return res.json(employee);
  }

  async create(req: Request, res: Response) {
    try {
      return res.status(201).json(await service.create(req.body));
    } catch (error) {
      return res.status(dependencyStatus(error)).json({ message: error instanceof Error ? error.message : "Invalid employee" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      return res.json(await service.update(req.params.id, req.body));
    } catch (error) {
      return res.status(dependencyStatus(error)).json({ message: error instanceof Error ? error.message : "Invalid employee" });
    }
  }

  async deactivate(req: Request, res: Response) {
    try {
      await service.deactivate(req.params.id);
      return res.status(204).end();
    } catch (error) {
      return res.status(dependencyStatus(error)).json({ message: error instanceof Error ? error.message : "Invalid employee" });
    }
  }
}
