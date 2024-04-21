import { realtime } from "ably-builder/builder/realtime";
import { configureAbly } from "@ably-labs/react-hooks";
import { useSession } from "next-auth/react";
import { getBaseUrl } from "../get-base-url";
import { schema } from "server/ably/schema";

const ably = configureAbly({
  authUrl: `${getBaseUrl()}/api/ably/auth`,
  autoConnect: false,
});

ably.connection.on("connected", () => console.log("Ably Client connected"));
ably.connection.on("closed", () => console.log("Ably Client disconnected"));

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

export const channels = realtime(ably, schema);
