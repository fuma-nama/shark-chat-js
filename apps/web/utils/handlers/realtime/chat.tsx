import { channels } from "@/utils/ably/client";
import { useChannels } from "ably-builder/hooks";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { removeNonce, setChannelUnread } from "./shared";
import { useMessageStore } from "@/utils/stores/chat";
import { useParams } from "next/navigation";

export function MessageEventManager() {
  const { status, data } = useSession();
  const utils = trpc.useUtils();
  const params = useParams() as { group?: string; channel?: string };

  const onEvent = channels.chat.useCallback(({ name, data: message }) => {
    if (name === "typing") return;

    const channelId =
      params.group != null
        ? utils.group.all
            .getData(undefined)
            ?.find((group) => group.id === Number(params.group))?.channel_id
        : params.channel;
    const active = channelId === message.channel_id;

    if (name === "message_sent") {
      const self = data && message.author?.id === data.user.id;

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

      return useMessageStore.setState((prev) => ({
        messages: {
          ...prev.messages,
          [message.channel_id]: [
            ...(prev.messages[message.channel_id] ?? []),
            message,
          ],
        },
      }));
    }

    if (name === "message_updated") {
      return useMessageStore.setState((prev) => {
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
    }

    if (name === "message_deleted") {
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
    enabled: status === "authenticated",
    staleTime: Infinity,
  });

  const dm = trpc.dm.channels.useQuery(undefined, {
    enabled: status === "authenticated",
    staleTime: Infinity,
  });

  const channelList = useMemo(() => {
    return [
      ...(groups.data?.map((group) => channels.chat.get([group.channel_id])) ??
        []),
      ...(dm.data?.map((channel) => channels.chat.get([channel.id])) ?? []),
    ];
  }, [groups.data, dm.data]);

  useChannels(channelList, onEvent);

  return <></>;
}
