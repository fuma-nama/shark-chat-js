import { useSession } from "@/utils/auth";
import { trpc } from "@/utils/trpc";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { schema } from "server/ably/schema";
import { useAbly } from "@/utils/ably/client";
import type { AblyMessageCallback } from "ably/react";
import { useCallbackRef } from "@/utils/hooks/use-callback-ref";

export function PrivateEventManager() {
  const router = useRouter();
  const params = useParams() as { group?: string; channel?: string };
  const { data: session } = useSession();
  const utils = trpc.useUtils();
  const ably = useAbly();

  const callback = useCallbackRef<AblyMessageCallback>(({ name, data }) => {
    if (name === "group_created") {
      const message = schema.private[name].parse(data);

      utils.group.info.setData({ groupId: message.id }, message);
      utils.group.all.setData(undefined, (groups) =>
        groups != null ? [message, ...groups] : undefined,
      );

      return;
    }

    if (name === "group_removed") {
      const message = schema.private[name].parse(data);

      if (params.group === message.id) {
        router.push("/");
      }

      utils.group.all.setData(undefined, (groups) =>
        groups?.filter((g) => g.id !== message.id),
      );

      return;
    }

    if (name === "open_dm") {
      const message = schema.private[name].parse(data);

      utils.dm.channels.setData(undefined, (prev) => {
        if (prev == null || prev.some((c) => c.id === message.id)) return prev;

        return [message, ...prev];
      });
      return;
    }

    if (name === "close_dm") {
      const message = schema.private[name].parse(data);

      utils.dm.channels.setData(undefined, (prev) => {
        return prev?.filter((c) => c.id !== message.channel_id);
      });

      if (params.channel === message.channel_id) {
        void router.push("/");
      }

      return;
    }
  });

  useEffect(() => {
    if (!session || !ably) return;

    const channel = ably.channels.get(schema.private.name(session.user.id));

    void channel.presence.enter();
    void channel.subscribe(callback);
    return () => {
      void channel.unsubscribe(callback);
    };
  }, [ably, callback, session]);

  return <></>;
}
