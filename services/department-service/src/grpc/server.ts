import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { DepartmentService } from "../services/department.service.js";

const service = new DepartmentService();
const protoPath =
  process.env.OPERATIONS_PROTO_PATH || path.resolve(process.cwd(), "../../proto/operations.proto");

export function startGrpcServer(port: number) {
  const definition = protoLoader.loadSync(protoPath, { keepCase: true });
  const proto = grpc.loadPackageDefinition(definition) as any;
  const server = new grpc.Server();

  server.addService(proto.stayease.internal.DepartmentDirectory.service, {
    ListDepartments: (call: any, callback: grpc.sendUnaryData<{ json: string }>) => {
      service
        .list(call.request.hotel_id || undefined)
        .then((departments) => callback(null, { json: JSON.stringify(departments) }))
        .catch((error) => callback({ code: grpc.status.INTERNAL, message: String(error) }));
    },
    GetDepartment: (call: any, callback: grpc.sendUnaryData<{ json: string }>) => {
      service
        .get(call.request.department_id)
        .then((department) =>
          department
            ? callback(null, { json: JSON.stringify(department) })
            : callback({ code: grpc.status.NOT_FOUND, message: "Department not found" }),
        )
        .catch((error) => callback({ code: grpc.status.INTERNAL, message: String(error) }));
    },
  });

  return new Promise<grpc.Server>((resolve, reject) => {
    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (error) => {
      if (error) return reject(error);
      server.start();
      console.log(`[Department Service] gRPC listening on ${port}`);
      resolve(server);
    });
  });
}
