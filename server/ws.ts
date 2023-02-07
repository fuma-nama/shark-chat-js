import { applyWSSHandler } from "@trpc/server/adapters/ws";
import ws from "ws";
import { appRouter } from "./routers/_app";

const wss = new ws.Server({
    port: 8000,
});
const handler = applyWSSHandler({ wss, router: appRouter, createContext: () => {

    return {
        session: null
    }
} });

wss.on("connection", (ws) => {
    console.log(`Connection (${wss.clients.size})`);
    ws.once("close", () => {
        console.log(`Connection (${wss.clients.size})`);
    });
});
console.log("✅ WebSocket Server listening on ws://localhost:8000");

process.on("SIGTERM", () => {
    console.log("SIGTERM");
    handler.broadcastReconnectNotification();
    wss.close();
});
