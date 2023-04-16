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

export async function getLastReads(
    keys: [group_id: number, user_id: string][]
) {
    const mapped_keys = keys.map(
        ([group_id, user_id]) => `last_read_g_${group_id}_u_${user_id}`
    );

    const values = await redis.mget<(string | null)[]>(...mapped_keys);

    return values.map((v) => (v == null ? null : new Date(v)));
}

export async function getDMLastRead(sender: string, receiver: string) {
    const value = await redis.get<string>(
        `last_read_dm_${sender}_u_${receiver}`
    );

    return value == null ? null : new Date(value);
}

export async function getDMLastReads(
    keys: [sender: string, receiver: string][]
) {
    const mapped_keys = keys.map(
        ([sender, receiver]) => `last_read_dm_${sender}_u_${receiver}`
    );
    const values = await redis.mget<(string | null)[]>(...mapped_keys);

    return values.map((v) => (v == null ? null : new Date(v)));
}
