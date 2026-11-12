import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { EmployeeService } from "../services/employee.service.js";

const service = new EmployeeService();
const protoPath =
  process.env.OPERATIONS_PROTO_PATH || path.resolve(process.cwd(), "../../proto/operations.proto");

export function startGrpcServer(port: number) {
  const definition = protoLoader.loadSync(protoPath, { keepCase: true });
  const proto = grpc.loadPackageDefinition(definition) as any;
  const server = new grpc.Server();

  server.addService(proto.stayease.internal.EmployeeDirectory.service, {
    ListEmployees: (call: any, callback: grpc.sendUnaryData<{ json: string }>) => {
      service
        .list(call.request.department_id || undefined)
        .then((employees) => callback(null, { json: JSON.stringify(employees) }))
        .catch((error) => callback({ code: grpc.status.INTERNAL, message: String(error) }));
    },
    GetEmployee: (call: any, callback: grpc.sendUnaryData<{ json: string }>) => {
      service
        .get(call.request.employee_id)
        .then((employee) =>
          employee
            ? callback(null, { json: JSON.stringify(employee) })
            : callback({ code: grpc.status.NOT_FOUND, message: "Employee not found" }),
        )
        .catch((error) => callback({ code: grpc.status.INTERNAL, message: String(error) }));
    },
  });

  return new Promise<grpc.Server>((resolve, reject) => {
    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (error) => {
      if (error) return reject(error);
      server.start();
      console.log(`[Employee Service] gRPC listening on ${port}`);
      resolve(server);
    });
  });
}
