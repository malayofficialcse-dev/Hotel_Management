import { OfferRepository } from "../repositories/offer.repository.js";

const repository = new OfferRepository();

export class OfferService {
  list(includeInactive: boolean) {
    return repository.list(includeInactive);
  }

  create(body: Record<string, unknown>) {
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const discountType = body.discountType;
    const discountValue = Number(body.discountValue);
    if (!/^[A-Z0-9_-]{2,32}$/.test(code)) throw new Error("code must be 2-32 letters, numbers, underscores, or hyphens");
    if (!name) throw new Error("name is required");
    if (discountType !== "PERCENTAGE" && discountType !== "FIXED") throw new Error("discountType must be PERCENTAGE or FIXED");
    if (!Number.isFinite(discountValue) || discountValue <= 0) throw new Error("discountValue must be greater than zero");
    if (discountType === "PERCENTAGE" && discountValue > 100) throw new Error("percentage discount cannot exceed 100");

    const startsAt = body.startsAt ? new Date(String(body.startsAt)) : undefined;
    const endsAt = body.endsAt ? new Date(String(body.endsAt)) : undefined;
    if (startsAt && !Number.isFinite(startsAt.getTime())) throw new Error("startsAt must be a valid date");
    if (endsAt && !Number.isFinite(endsAt.getTime())) throw new Error("endsAt must be a valid date");
    if (startsAt && endsAt && endsAt <= startsAt) throw new Error("endsAt must be later than startsAt");

    const hotelIds = body.hotelIds;
    if (hotelIds !== undefined && (!Array.isArray(hotelIds) || hotelIds.some((id) => typeof id !== "string"))) {
      throw new Error("hotelIds must be an array of strings");
    }

    return repository.create({
      code,
      name,
      description: typeof body.description === "string" ? body.description.trim() : "",
      discountType,
      discountValue,
      ...(startsAt ? { startsAt } : {}),
      ...(endsAt ? { endsAt } : {}),
      hotelIds: hotelIds || [],
    });
  }

  deactivate(id: string) {
    return repository.deactivate(id);
  }
}
