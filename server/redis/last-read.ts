import redis from "./client";

export function setDMLastRead(sender: string, receiver: string, value: Date) {
    return redis.set(`last_read_dm_${sender}_u_${receiver}`, value);
}

export function setLastRead(group_id: number, user_id: string, value: Date) {
    return redis.set(`last_read_g_${group_id}_u_${user_id}`, value);
}

export async function getLastRead(group_id: number, user_id: string) {
    const value = await redis.get<string>(
        `last_read_g_${group_id}_u_${user_id}`
    );

    return value == null ? null : new Date(value);
}

export async function getDMLastRead(sender: string, receiver: string) {
    const value = await redis.get<string>(
        `last_read_dm_${sender}_u_${receiver}`
    );

    return value == null ? null : new Date(value);
}
