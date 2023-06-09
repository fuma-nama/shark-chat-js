import { defineTRPCLimiter } from "@trpc-limiter/core";
import { Ratelimit } from "@upstash/ratelimit";
import redis from "./client";
import { Context } from "../trpc";

export const createTRPCUpstashLimiter = defineTRPCLimiter({
    store: (opts) => {
        if (process.env.NODE_ENV === "development") return null;

        return new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(opts.max, `${opts.windowMs} ms`),
        });
    },
    async isBlocked(store, fingerprint) {
        if (store == null) return null;
        const { success, ...rest } = await store.limit(fingerprint);

        return success ? null : rest;
    },
});

export function getFingerprintFromIP(req: Context["req"]) {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded
        ? (typeof forwarded === "string" ? forwarded : forwarded[0])?.split(
              /, /
          )[0]
        : req.socket.remoteAddress;
    return ip || "127.0.0.1";
}
