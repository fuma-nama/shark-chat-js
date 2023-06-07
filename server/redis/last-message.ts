import redis from "./client";

function getKey(channelId: string) {
    return `last_message_${channelId}`;
}

export function getLastMessage(channelId: string) {
    return redis.get<string>(getKey(channelId));
}

export function getLastMessages(channelIds: string[]) {
    return redis.mget<(string | null)[]>(...channelIds.map((id) => getKey(id)));
}

export function setLastMessage(channelId: string, content: string) {
    redis.set(getKey(channelId), content);
}
