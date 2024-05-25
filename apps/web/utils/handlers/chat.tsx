import { trpc } from "@/utils/trpc";
import { useSession } from "@/utils/auth";
import { useEffect, useMemo } from "react";
import { removeNonce, setChannelUnread } from "./shared";
import { useMessageStore } from "@/utils/stores/chat";
import { useParams } from "next/navigation";
import { schema } from "server/ably/schema";
import { useAbly } from "@/utils/ably/client";
import { useCallbackRef } from "@/utils/hooks/use-callback-ref";
import type { AblyMessageCallback } from "ably/react";

export function MessageEventManager() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();
  const params = useParams() as { group?: string; channel?: string };
  const ably = useAbly();

  const activeChannelId = params.group
    ? utils.group.all
        .getData(undefined)
        ?.find((group) => group.id === params.group)?.channel_id
    : params.channel;

  const callback = useCallbackRef<AblyMessageCallback>(({ name, data }) => {
    if (!session) return;

    if (name === "typing") {
      const message = schema.chat[name].parse(data);

      useMessageStore.getState().setUserTyping(message.channelId, message.user);
      return;
    }

    if (name === "message_sent") {
      const message = schema.chat[name].parse(data);
      const self = message.author?.id === session.user.id;
      const active = activeChannelId === message.channel_id;

      if (active || self) {
        utils.chat.checkout.setData(
          { channelId: message.channel_id },
          { last_read: null },
        );
      } else {
        setChannelUnread(utils, message.channel_id, (prev) => prev + 1);
      }

      if (active && !self) {
        void utils.client.chat.read.mutate({
          channelId: message.channel_id,
        });
      }

      if (message.nonce != null && removeNonce(message.nonce)) {
        useMessageStore
          .getState()
          .removeSending(message.channel_id, message.nonce);
      }

      useMessageStore.setState((prev) => ({
        messages: {
          ...prev.messages,
          [message.channel_id]: [
            ...(prev.messages[message.channel_id] ?? []),
            message,
          ],
        },
      }));
      return;
    }

    if (name === "message_updated") {
      const message = schema.chat[name].parse(data);

      useMessageStore.setState((prev) => {
        const updated = prev.messages[message.channel_id]?.map((item) => {
          if (item.id === message.id) {
            return {
              ...item,
              ...message,
            };
          }

          return item;
        });

        return {
          messages: {
            ...prev.messages,
            [message.channel_id]: updated,
          },
        };
      });
      return;
    }

    if (name === "message_deleted") {
      const message = schema.chat[name].parse(data);

      return useMessageStore.setState((prev) => {
        const filtered = prev.messages[message.channel_id]?.filter(
          (item) => item.id !== message.id,
        );

        return {
          messages: {
            ...prev.messages,
            [message.channel_id]: filtered,
          },
        };
      });
    }
  });

  const groups = trpc.group.all.useQuery(undefined, {
    staleTime: Infinity,
  });

  const dm = trpc.dm.channels.useQuery(undefined, {
    staleTime: Infinity,
  });

  const channelIds: string[] = useMemo(
    () => [
      ...(dm.data?.map((channel) => channel.id) ?? []),
      ...(groups.data?.map((group) => group.channel_id) ?? []),
    ],
    [dm.data, groups.data],
  );

  useEffect(() => {
    if (!ably) return;

    const channels = channelIds.map((id) =>
      ably.channels.get(schema.chat.name(id)),
    );

    for (const c of channels) {
      void c.subscribe(callback);
      void c.presence.enter();
      void c.presence.subscribe((e) => {
        useMessageStore.setState((prev) => ({
          status: {
            ...prev.status,
            [e.clientId]: {
              type: ["present", "enter"].includes(e.action)
                ? "online"
                : "offline",
            },
          },
        }));
      });
    }
    return () => {
      for (const c of channels) {
        void c.unsubscribe(callback);
      }
    };
  }, [ably, callback, channelIds]);

  return <></>;
}
