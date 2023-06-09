/**
 * Convert a string into hash
 * @returns Hash value of input string
 */
export function hash(s: string): number {
    let hash = 0,
        i,
        chr;
    if (s.length === 0) return hash;
    for (i = 0; i < s.length; i++) {
        chr = s.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

/**
 * @param obj An object
 * @param keys keys to pick
 * @returns A new object that only contains specified keys
 */
export function pick<T extends Record<string, any>, K extends (keyof T)[]>(
    obj: T,
    ...keys: K
): Pick<T, K[number]> {
    const filtered = Object.entries(obj).filter(([k]) => keys.includes(k));

    return Object.fromEntries(filtered) as unknown as Pick<T, K[number]>;
}
