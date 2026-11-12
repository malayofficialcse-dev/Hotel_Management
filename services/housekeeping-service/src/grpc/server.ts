import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { HousekeepingService } from "../services/housekeeping.service.js";

const service = new HousekeepingService();
const protoPath =
  process.env.OPERATIONS_PROTO_PATH || path.resolve(process.cwd(), "../../proto/operations.proto");

export function startGrpcServer(port: number) {
  const definition = protoLoader.loadSync(protoPath, { keepCase: true });
  const proto = grpc.loadPackageDefinition(definition) as any;
  const server = new grpc.Server();

  server.addService(proto.stayease.internal.Housekeeping.service, {
    GetTasks: (call: any, callback: grpc.sendUnaryData<{ json: string }>) => {
      service
        .list(call.request.hotel_id || undefined)
        .then((tasks) => callback(null, { json: JSON.stringify(tasks) }))
        .catch((error) => callback({ code: grpc.status.INTERNAL, message: String(error) }));
    },
  });

  return new Promise<grpc.Server>((resolve, reject) => {
    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (error) => {
      if (error) return reject(error);
      server.start();
      console.log(`[Housekeeping Service] gRPC listening on ${port}`);
      resolve(server);
    });
  });
}
