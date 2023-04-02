import { configureAbly } from "@ably-labs/react-hooks";
import { channels } from ".";

export function initClient() {
    const prefix = process.env.API_ROOT || "";
    const ably = configureAbly({
        authUrl: `${prefix}/api/ably/auth`,
    });

    ably.connection.on("connected", () => console.log("Ably Client connected"));
    ably.connection.on("closed", () => console.log("Ably Client disconnected"));

    channels.config(ably);
}
