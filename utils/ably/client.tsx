import { configureAbly } from "@ably-labs/react-hooks";
import { channels } from ".";
import { useSession } from "next-auth/react";
import { getBaseUrl } from "../get-base-url";

const ably = configureAbly({
    authUrl: `${getBaseUrl()}/api/ably/auth`,
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
