import "dotenv/config";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { startGrpcServer } from "./grpc/server.js";
const port = Number(process.env.PORT || 8012);
const grpcPort = Number(process.env.GRPC_PORT || 50059);
async function start() {
    await connectDatabase();
    const app = createApp(grpcPort);
    const grpcServer = await startGrpcServer(grpcPort);
    let httpServer;
    try {
        httpServer = await new Promise((resolve, reject) => {
            const server = app.listen(port, () => resolve(server));
            server.once("error", reject);
        });
    }
    catch (error) {
        grpcServer.forceShutdown();
        await mongoose.disconnect();
        throw error;
    }
    console.log(`[Department Service] HTTP listening on ${port}`);
    const shutdown = () => {
        grpcServer.tryShutdown(() => undefined);
        httpServer.close(() => void mongoose.disconnect().then(() => process.exit(0)));
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
}
start().catch((error) => {
    console.error("[Department Service] startup failed", error);
    process.exitCode = 1;
});
