import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { HotelService } from "../services/hotel.service.js";

const service = new HotelService();
const protoPath =
  process.env.OPERATIONS_PROTO_PATH || path.resolve(process.cwd(), "../../proto/operations.proto");

export function startGrpcServer(port: number) {
  const definition = protoLoader.loadSync(protoPath, { keepCase: true });
  const proto = grpc.loadPackageDefinition(definition) as any;
  const server = new grpc.Server();

  server.addService(proto.stayease.internal.HotelCatalog.service, {
    GetHotel: (call: any, callback: grpc.sendUnaryData<{ json: string }>) => {
      service
        .get(call.request.hotel_id)
        .then((hotel) => callback(null, { json: JSON.stringify(hotel || null) }))
        .catch((error) => callback({ code: grpc.status.INTERNAL, message: String(error) }));
    },
  });

  return new Promise<grpc.Server>((resolve, reject) => {
    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (error) => {
      if (error) return reject(error);
      server.start();
      console.log(`[Hotel Service] gRPC listening on ${port}`);
      resolve(server);
    });
  });
}
