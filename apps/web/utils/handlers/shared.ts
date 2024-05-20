import { RouterUtils } from "@/utils/trpc";

export const nonces = new Set<number>();

export function addNonce(nonce: number) {
  return nonces.add(nonce);
}

export function removeNonce(nonce: number) {
  return nonces.delete(nonce);
}

export function setChannelUnread(
  utils: RouterUtils,
  channelId: string,
  fn: (prev: number) => number,
) {
  utils.dm.channels.setData(undefined, (prev) =>
    prev?.map((channel) => {
      if (channel.id === channelId) {
        return {
          ...channel,
          unread_messages: fn(channel.unread_messages),
        };
      }

      return channel;
    }),
  );

  utils.group.all.setData(undefined, (groups) =>
    groups?.map((group) => {
      if (group.channel_id === channelId) {
        return {
          ...group,
          unread_messages: fn(group.unread_messages),
        };
      }

      return group;
    }),
  );
}
