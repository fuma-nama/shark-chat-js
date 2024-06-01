import { useSession } from "@/utils/auth";
import { useEffect } from "react";
import { getBaseUrl } from "@/utils/get-base-url";
import type { Realtime } from "ably";
import { useMessageStore } from "@/utils/stores/chat";

export function useAbly(): Realtime | undefined {
  return useMessageStore((s) => s.ably);
}

export function AblyClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const ably = useMessageStore((s) => s.ably);
  const { status } = useSession();
  useEffect(() => {
    if (ably) return;

    import("ably").then((res) => {
      const instance = new res.Realtime({
        authUrl: `${getBaseUrl()}/api/ably/auth`,
        authMethod: "POST",
        autoConnect: false,
      });
      instance.connection.on("connected", () =>
        console.log("Ably Client connected"),
      );
      instance.connection.on("closed", () =>
        console.log("Ably Client disconnected"),
      );

      useMessageStore.setState({
        ably: instance,
      });
    });
  }, [ably]);

  useEffect(() => {
    if (!ably) return;
    const connected = ably.connection.state === "connected";

    if (!connected && status === "authenticated") {
      ably.connect();
    }

    if (connected && status === "unauthenticated") {
      ably.close();
    }
  }, [ably, status]);

  return <>{children}</>;
}
