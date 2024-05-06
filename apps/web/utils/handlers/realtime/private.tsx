import { channels } from "@/utils/ably/client";
import { useAbly } from "ably/react";
import { useSession } from "next-auth/react";
import Router from "next/router";
import { createGroup, deleteGroup } from "./shared";
import { trpc } from "@/utils/trpc";

export function PrivateEventManager() {
  const ably = useAbly();
  const { data, status } = useSession();
  const utils = trpc.useUtils();

  const onEvent = channels.private.useCallback(({ data: message, name }) => {
    if (name === "group_created") {
      return createGroup(utils, message);
    }

    if (name === "group_removed") {
      return deleteGroup(utils, message.id);
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

      if (Router.query.channel === message.channel_id) {
        void Router.push("/home");
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
