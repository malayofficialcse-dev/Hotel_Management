import { DepartmentRepository } from "../repositories/department.repository.js";
import { requireHotel } from "./hotel-client.service.js";
const repository = new DepartmentRepository();
export class DepartmentService {
    list(hotelId) {
        return repository.list(hotelId);
    }
    get(id) {
        return repository.findById(id);
    }
    async create(body) {
        if (typeof body.name !== "string" || !body.name.trim()) {
            throw new Error("name is required");
        }
        if (typeof body.hotelId !== "string" || !body.hotelId.trim()) {
            throw new Error("hotelId is required");
        }
        await requireHotel(body.hotelId);
        return repository.create({
            name: body.name,
            hotelId: body.hotelId,
            description: body.description,
            headId: body.headId,
            isActive: body.isActive,
        });
    }
    async update(id, body) {
        const data = {};
        for (const field of ["name", "hotelId", "description", "headId", "isActive"]) {
            if (body[field] !== undefined)
                data[field] = body[field];
        }
        if (Object.keys(data).length === 0)
            throw new Error("at least one supported field is required");
        if (typeof data.hotelId === "string")
            await requireHotel(data.hotelId);
        return repository.update(id, data);
    }
    delete(id) {
        return repository.delete(id);
    }
}
