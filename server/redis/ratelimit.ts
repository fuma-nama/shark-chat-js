import { defineTRPCLimiter } from "@trpc-limiter/core";
import { Ratelimit } from "@upstash/ratelimit";
import redis from "./client";
import { NextApiRequest } from "next";

export const createTRPCUpstashLimiter = defineTRPCLimiter({
    store: (opts) =>
        new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(opts.max, `${opts.windowMs} ms`),
        }),
    async isBlocked(store, fingerprint) {
        const { success, pending, ...rest } = await store.limit(fingerprint);
        await pending;
        return success ? null : rest;
    },
});

export function getFingerprintFromIP(req: NextApiRequest) {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded
        ? (typeof forwarded === "string" ? forwarded : forwarded[0])?.split(
              /, /
          )[0]
        : req.socket.remoteAddress;
    return ip || "127.0.0.1";
}
