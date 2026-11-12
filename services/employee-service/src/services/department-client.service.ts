import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const protoPath =
  process.env.OPERATIONS_PROTO_PATH || path.resolve(process.cwd(), "../../proto/operations.proto");
const definition = protoLoader.loadSync(protoPath, { keepCase: true });
const proto = grpc.loadPackageDefinition(definition) as any;
const DepartmentDirectory = proto.stayease.internal.DepartmentDirectory;
const client = new DepartmentDirectory(
  process.env.DEPARTMENT_GRPC_URL || "localhost:50059",
  grpc.credentials.createInsecure(),
);

export interface DepartmentSummary {
  _id?: string;
  id?: string;
  name: string;
  hotelId: string;
  isActive?: boolean;
}

function decodeDepartments(reply: { json: string }): DepartmentSummary[] {
  const parsed: unknown = JSON.parse(reply.json || "[]");
  if (!Array.isArray(parsed)) throw new Error("Department service returned an invalid response");
  return parsed as DepartmentSummary[];
}

export class DepartmentClientService {
  async list() {
    const reply = await new Promise<{ json: string }>((resolve, reject) => {
      client.listDepartments({ hotel_id: "" }, (error: grpc.ServiceError | null, result: { json: string }) =>
        error ? reject(error) : resolve(result),
      );
    });
    return decodeDepartments(reply);
  }

  async requireDepartment(id: string) {
    const reply = await new Promise<{ json: string }>((resolve, reject) => {
      client.getDepartment({ department_id: id }, (error: grpc.ServiceError | null, result: { json: string }) =>
        error ? reject(error) : resolve(result),
      );
    });
    const parsed: unknown = JSON.parse(reply.json || "null");
    if (!parsed || typeof parsed !== "object") throw new Error("Department not found");
    const department = parsed as DepartmentSummary;
    if (department.isActive === false) throw new Error("Department is inactive");
    return department;
  }
}
