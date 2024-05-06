import { realtime } from "ably-builder/builder/realtime";
import { useSession } from "next-auth/react";
import { getBaseUrl } from "../get-base-url";
import { schema } from "server/ably/schema";
import { Realtime } from "ably";
import { AblyProvider } from "ably/react";

const ably = new Realtime({
  authUrl: `${getBaseUrl()}/api/ably/auth`,
  autoConnect: false,
});

ably.connection.on("connected", () => console.log("Ably Client connected"));
ably.connection.on("closed", () => console.log("Ably Client disconnected"));

export function AblyClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();

  const connected = ably.connection.state === "connected";

  if (!connected && status === "authenticated") {
    ably.connect();
  }

  if (connected && status === "unauthenticated") {
    ably.close();
  }

  return <AblyProvider client={ably}>{children}</AblyProvider>;
}

export const channels = realtime(ably, schema);
