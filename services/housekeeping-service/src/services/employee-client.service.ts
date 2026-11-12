import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const protoPath =
  process.env.OPERATIONS_PROTO_PATH || path.resolve(process.cwd(), "../../proto/operations.proto");
const definition = protoLoader.loadSync(protoPath, { keepCase: true });
const proto = grpc.loadPackageDefinition(definition) as any;
const EmployeeDirectory = proto.stayease.internal.EmployeeDirectory;
const client = new EmployeeDirectory(
  process.env.EMPLOYEE_GRPC_URL || "localhost:50057",
  grpc.credentials.createInsecure(),
);

export async function requireEmployee(id: string) {
  return new Promise<void>((resolve, reject) => {
    client.getEmployee({ employee_id: id }, (error: grpc.ServiceError | null) =>
      error ? reject(error) : resolve(),
    );
  });
}
