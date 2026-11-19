import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabases, disconnectDatabases } from "./config/databases.js";
import { prisma } from "./domains/employee/config/database.js";

async function start() {
  await connectDatabases();
  await prisma.$connect();
  const server = await createApp();
  const port = Number(process.env.PORT || 8020);
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(port, resolve); });
  console.log(`[Operations Service] all six domains listening on ${port}`);
  const shutdown = async () => { server.close(); await Promise.all([disconnectDatabases(), prisma.$disconnect()]); process.exit(0); };
  process.once("SIGINT", shutdown); process.once("SIGTERM", shutdown);
}
start().catch((error) => { console.error("[Operations Service] startup failed", error); process.exitCode = 1; });
