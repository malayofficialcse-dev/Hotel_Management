import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
const protoPath = process.env.OPERATIONS_PROTO_PATH || path.resolve(process.cwd(), "../../proto/operations.proto");
const definition = protoLoader.loadSync(protoPath, { keepCase: true });
const proto = grpc.loadPackageDefinition(definition);
const HotelCatalog = proto.stayease.internal.HotelCatalog;
const client = new HotelCatalog(process.env.HOTEL_GRPC_URL || "localhost:50053", grpc.credentials.createInsecure());
export async function requireHotel(id) {
    const reply = await new Promise((resolve, reject) => {
        client.getHotel({ hotel_id: id }, (error, result) => error ? reject(error) : resolve(result));
    });
    const parsed = JSON.parse(reply.json || "null");
    if (!parsed || typeof parsed !== "object" || ("isActive" in parsed && parsed.isActive === false)) {
        throw new Error("Hotel not found");
    }
}
