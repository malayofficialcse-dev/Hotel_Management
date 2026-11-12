import { Router } from "express";
import { EmployeeController } from "../controllers/employee.controller.js";

const controller = new EmployeeController();
export const employeeRoutes = Router();

employeeRoutes.get("/departments", (req, res, next) => void controller.departments(req, res).catch(next));
employeeRoutes.get("/", (req, res, next) => void controller.list(req, res).catch(next));
employeeRoutes.post("/", (req, res, next) => void controller.create(req, res).catch(next));
employeeRoutes.get("/:id", (req, res, next) => void controller.get(req, res).catch(next));
employeeRoutes.patch("/:id", (req, res, next) => void controller.update(req, res).catch(next));
employeeRoutes.put("/:id", (req, res, next) => void controller.update(req, res).catch(next));
employeeRoutes.delete("/:id", (req, res, next) => void controller.deactivate(req, res).catch(next));
