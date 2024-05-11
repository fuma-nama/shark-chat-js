import { channels } from "@/utils/ably/client";
import { useChannels } from "ably-builder/hooks";
import { RouterInput, RouterUtils, trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { getMessageVariables } from "@/utils/variables";
import { removeNonce, setChannelUnread } from "./shared";
import { useMessageStore } from "@/utils/stores/chat";
import { MessageType } from "@/utils/types";
import { useParams } from "next/navigation";

export function MessageEventManager() {
  const { status, data } = useSession();
  const utils = trpc.useUtils();
  const params = useParams() as { group?: string; channel?: string };

  const onEvent = channels.chat.useCallback(({ name, data: message }) => {
    if (name === "typing") return;

    const variables = getMessageVariables(message.channel_id);
    const channelId =
      params.group != null
        ? utils.group.all
            .getData(undefined)
            ?.find((group) => group.id === Number(params.group))?.channel_id
        : params.channel;
    const active = channelId === message.channel_id;

    if (name === "message_sent") {
      const self = message.author_id === data?.user.id;

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

      return addMessage(utils, variables, message);
    }

    if (name === "message_updated") {
      return utils.chat.messages.setInfiniteData(variables, (prev) => {
        if (prev == null) return prev;

        const pages = prev.pages.map((page) =>
          page.map((msg) => {
            if (msg.id === message.id) {
              return {
                ...msg,
                ...message,
              };
            }

            return msg;
          }),
        );

        return {
          ...prev,
          pages,
        };
      });
    }

    if (name === "message_deleted") {
      return utils.chat.messages.setInfiniteData(variables, (prev) => {
        if (prev == null) return prev;

        const pages = prev.pages.map((page) => {
          return page.filter((msg) => msg.id !== message.id);
        });

        return {
          ...prev,
          pages,
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

function addMessage(
  utils: RouterUtils,
  variables: RouterInput["chat"]["messages"],
  message: MessageType,
) {
  utils.chat.messages.setInfiniteData(variables, (prev) => {
    if (prev == null) return prev;

    return {
      ...prev,
      pages: [...prev.pages, [message]],
    };
  });

  utils.dm.channels.setData(undefined, (prev) => {
    if (prev == null) return prev;

    return prev.map((channel) =>
      channel.id === message.channel_id
        ? { ...channel, last_message: message }
        : channel,
    );
  });

  utils.group.all.setData(undefined, (prev) => {
    if (prev == null) return prev;
    return prev.map((group) =>
      group.channel_id === message.channel_id
        ? { ...group, last_message: message }
        : group,
    );
  });
}
