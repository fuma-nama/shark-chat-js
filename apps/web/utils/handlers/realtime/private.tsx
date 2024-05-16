import { channels } from "@/utils/ably/client";
import { useSession } from "next-auth/react";
import { trpc } from "@/utils/trpc";
import { useParams, useRouter } from "next/navigation";

export function PrivateEventManager() {
  const router = useRouter();
  const params = useParams() as { group?: string; channel?: string };
  const { data, status } = useSession();
  const utils = trpc.useUtils();

  const onEvent = channels.private.useCallback(({ data: message, name }) => {
    if (name === "group_created") {
      utils.group.info.setData({ groupId: message.id }, message);
      utils.group.all.setData(undefined, (groups) =>
        groups != null ? [message, ...groups] : undefined,
      );
      return;
    }

    if (name === "group_removed") {
      const active = params.group === message.id.toString();

      if (active) {
        router.push("/");
      }

      utils.group.all.setData(undefined, (groups) =>
        groups?.filter((g) => g.id !== message.id),
      );
    }

    if (name === "open_dm") {
      return utils.dm.channels.setData(undefined, (prev) => {
        if (prev == null || prev.some((c) => c.id === message.id)) return prev;

        return [message, ...prev];
      });
    }

    if (name === "close_dm") {
      utils.dm.channels.setData(undefined, (prev) => {
        return prev?.filter((c) => c.id !== message.channel_id);
      });

      if (params.channel === message.channel_id) {
        void router.push("/");
      }

      return;
    }
  });

  channels.private.useChannel(
    [data?.user?.id ?? ""],
    {
      enabled: status === "authenticated",
    },
    onEvent,
  );

  return <></>;
}
