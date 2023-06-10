export function oneOrNull<T>(items: T[]): T | null {
    if (items.length === 0) return null;

    return items[0];
}

export function requireOne<T>(items: T[], error?: string): T {
    if (items.length !== 1) {
        throw new Error(error);
    }

    return items[0];
}
