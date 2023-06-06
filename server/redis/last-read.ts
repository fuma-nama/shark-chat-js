import redis from "./client";

export function setLastRead(channel_id: string, user_id: string, value: Date) {
    return redis.set(`last_read_g_${channel_id}_u_${user_id}`, value);
}

export async function getLastRead(channel_id: string, user_id: string) {
    const value = await redis.get<string>(
        `last_read_g_${channel_id}_u_${user_id}`
    );

    return value == null ? null : new Date(value);
}

export async function getLastReads(
    keys: [channel_id: string, user_id: string][]
) {
    const mapped_keys = keys.map(
        ([channel_id, user_id]) => `last_read_g_${channel_id}_u_${user_id}`
    );

    const values = await redis.mget<(string | null)[]>(...mapped_keys);

    return values.map((v) => (v == null ? null : new Date(v)));
}
