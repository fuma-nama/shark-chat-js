import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef } from "react";
import { removeNonce, setChannelUnread } from "./shared";
import { useMessageStore } from "@/utils/stores/chat";
import { useParams } from "next/navigation";
import { AblyMessageCallback, useAbly } from "ably/react";
import { schema } from "server/ably/schema";

export function MessageEventManager() {
  const { status, data: session } = useSession();
  const utils = trpc.useUtils();
  const params = useParams() as { group?: string; channel?: string };
  const ably = useAbly();
  const callback = useRef<AblyMessageCallback>();

  const activeChannelId = params.group
    ? utils.group.all
        .getData(undefined)
        ?.find((group) => group.id === params.group)?.channel_id
    : params.channel;

  callback.current = useCallback<AblyMessageCallback>(
    ({ name, data }) => {
      if (!session) return;

      if (name === "typing") {
        const message = schema.chat[name].parse(data);
        console.log("update");
        useMessageStore.setState((prev) => {
          const typing = new Map(prev.typing);
          let list = typing.get(message.channelId) ?? [];

          list = list.filter((i) => i.user.id !== message.user.id);
          list.push({
            user: message.user,
            timestamp: Date.now(),
          });
          typing.set(message.channelId, list);
          return {
            typing,
          };
        });
        return;
      }

      if (name === "message_sent") {
        const message = schema.chat[name].parse(data);
        const self = message.author?.id === session.user.id;
        const active = activeChannelId === message.channel_id;

        if (active || self) {
          utils.chat.checkout.setData(
            { channelId: message.channel_id },
            { last_read: message.timestamp },
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
    },
    [activeChannelId, session, utils],
  );

  const groups = trpc.group.all.useQuery(undefined, {
    enabled: status === "authenticated",
    staleTime: Infinity,
  });

  const dm = trpc.dm.channels.useQuery(undefined, {
    enabled: status === "authenticated",
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!groups.data || !dm.data) return;

    const channels = [
      ...groups.data.map((group) =>
        ably.channels.get(schema.chat.name(group.channel_id)),
      ),
      ...dm.data.map((channel) =>
        ably.channels.get(schema.chat.name(channel.id)),
      ),
    ];

    const listener: AblyMessageCallback = (res) => callback.current?.(res);

    for (const c of channels) {
      void c.subscribe(listener);
    }
    return () => {
      for (const c of channels) {
        void c.unsubscribe(listener);
      }
    };
  }, [ably, dm.data, groups.data]);

  return <></>;
}
