import { status as grpcStatus } from "@grpc/grpc-js";
import { DepartmentService } from "../services/department.service.js";
const service = new DepartmentService();
function dependencyStatus(error) {
    if (typeof error !== "object" || error === null || !("code" in error))
        return 400;
    return error.code === grpcStatus.UNAVAILABLE || error.code === grpcStatus.DEADLINE_EXCEEDED ? 503 : 400;
}
export class DepartmentController {
    async list(req, res) {
        res.json(await service.list(typeof req.query.hotelId === "string" ? req.query.hotelId : undefined));
    }
    async get(req, res) {
        const department = await service.get(req.params.id);
        if (!department)
            return res.status(404).json({ message: "Department not found" });
        return res.json(department);
    }
    async create(req, res) {
        try {
            return res.status(201).json(await service.create(req.body));
        }
        catch (error) {
            return res.status(dependencyStatus(error)).json({ message: error instanceof Error ? error.message : "Invalid department" });
        }
    }
    async update(req, res) {
        try {
            const department = await service.update(req.params.id, req.body);
            if (!department)
                return res.status(404).json({ message: "Department not found" });
            return res.json(department);
        }
        catch (error) {
            return res.status(dependencyStatus(error)).json({ message: error instanceof Error ? error.message : "Invalid department" });
        }
    }
    async delete(req, res) {
        const department = await service.delete(req.params.id);
        if (!department)
            return res.status(404).json({ message: "Department not found" });
        return res.status(204).end();
    }
}
