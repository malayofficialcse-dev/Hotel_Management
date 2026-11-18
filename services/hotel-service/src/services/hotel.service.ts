import { HotelRepository, type HotelFilters } from "../repositories/hotel.repository.js";

const repository = new HotelRepository();
const editableFields = [
  "slug",
  "name",
  "city",
  "location",
  "latitude",
  "longitude",
  "mainImage",
  "galleryImages",
  "basePrice",
  "rating",
  "reviewsCount",
  "tag",
  "offer",
  "category",
  "description",
  "amenities",
  "isActive",
];

export class HotelService {
  list(filters: HotelFilters) {
    return repository.list(filters);
  }

  get(identifier: string) {
    return repository.findByIdentifier(identifier);
  }

  async create(body: Record<string, unknown>) {
    const data = this.pickFields(body);
    this.validateCoordinates(data);
    for (const field of ["name", "city", "location", "basePrice", "category"]) {
      if (data[field] === undefined || data[field] === "") throw new Error(`${field} is required`);
    }
    if (typeof data.name !== "string") throw new Error("name must be a string");
    data.slug =
      typeof data.slug === "string" && data.slug.trim()
        ? data.slug.trim().toLowerCase()
        : data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return repository.create(data);
  }

  update(identifier: string, body: Record<string, unknown>) {
    const data = this.pickFields(body);
    this.validateCoordinates(data);
    if (Object.keys(data).length === 0) throw new Error("at least one supported field is required");
    if (typeof data.slug === "string") data.slug = data.slug.trim().toLowerCase();
    return repository.update(identifier, data);
  }

  delete(identifier: string) {
    return repository.delete(identifier);
  }

  private pickFields(body: Record<string, unknown>) {
    return Object.fromEntries(editableFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
  }

  private validateCoordinates(data: Record<string, unknown>) {
    const hasLatitude = data.latitude !== undefined;
    const hasLongitude = data.longitude !== undefined;
    if (hasLatitude !== hasLongitude) throw new Error("latitude and longitude must be provided together");
    if (!hasLatitude) return;
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error("latitude must be between -90 and 90");
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error("longitude must be between -180 and 180");
    data.latitude = latitude;
    data.longitude = longitude;
  }
}
