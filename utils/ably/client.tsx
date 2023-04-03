import { configureAbly } from "@ably-labs/react-hooks";
import { channels } from ".";
import { useSession } from "next-auth/react";

const prefix = process.env.API_ROOT || "";
const ably = configureAbly({
    authUrl: `${prefix}/api/ably/auth`,
    autoConnect: false,
});

ably.connection.on("connected", () => console.log("Ably Client connected"));
ably.connection.on("closed", () => console.log("Ably Client disconnected"));

channels.config(ably);

export function AblyClientProvider() {
    const { status } = useSession();

    const connected = ably.connection.state === "connected";

    if (!connected && status === "authenticated") {
        ably.connect();
    }

    if (connected && status === "unauthenticated") {
        ably.close();
    }

    return <></>;
}
