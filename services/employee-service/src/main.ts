import "dotenv/config";
import { createApp } from "./app.js";
import { prisma } from "./config/database.js";
import { startGrpcServer } from "./grpc/server.js";

const port = Number(process.env.PORT || 8007);
const grpcPort = Number(process.env.GRPC_PORT || 50057);

async function start() {
  await prisma.$connect();

  const app = createApp(grpcPort);
  const httpServer = app.listen(port, () => {
    console.log(`[Employee Service] HTTP listening on ${port}`);
  });
  const grpcServer = await startGrpcServer(grpcPort);

  const shutdown = async () => {
    grpcServer.tryShutdown(() => undefined);
    httpServer.close(() => undefined);
    await prisma.$disconnect();
    process.exit(0);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

start().catch(async (error) => {
  console.error("[Employee Service] startup failed", error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
