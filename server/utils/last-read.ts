import redis from "../redis";

export function setDMLastRead(sender: string, receiver: string, value: Date) {
    return redis.set(`last_read_dm_${sender}_u_${receiver}`, value);
}

export function setLastRead(group_id: number, user_id: string, value: Date) {
    return redis.set(`last_read_g_${group_id}_u_${user_id}`, value);
}

export function getLastRead(group_id: number, user_id: string) {
    return redis.get<Date>(`last_read_g_${group_id}_u_${user_id}`);
}

export function getDMLastRead(sender: string, receiver: string) {
    return redis.get<Date>(`last_read_dm_${sender}_u_${receiver}`);
}
