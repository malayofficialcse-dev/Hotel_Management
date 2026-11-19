import { HotelModel } from "../../hotel/models/hotel.model.js";

export async function requireHotel(id: string) {
  const query = id.match(/^[a-f\d]{24}$/i) ? { _id: id } : { slug: id };
  const hotel = await HotelModel.findOne(query).lean();
  if (!hotel || hotel.isActive === false) throw new Error("Hotel not found");
}
