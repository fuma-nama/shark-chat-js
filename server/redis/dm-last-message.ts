import { getHash } from "@/utils/get-hash";
import redis from "./client";

function getKey(user1: string, user2: string) {
    if (getHash(user1) > getHash(user2)) {
        return `last_message_dm_${user1}_u_${user2}`;
    } else {
        return `last_message_dm_${user2}_u_${user1}`;
    }
}

export function getLastMessage(user1: string, user2: string) {
    return redis.get<string>(getKey(user1, user2));
}

export function setLastMessage(user1: string, user2: string, content: string) {
    redis.set(getKey(user1, user2), content);
}
