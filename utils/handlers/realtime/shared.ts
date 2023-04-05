export const nonces = new Set<number>();

export function addNonce(nonce: number) {
    return nonces.add(nonce);
}

export function removeNonce(nonce: number) {
    return nonces.delete(nonce);
}
