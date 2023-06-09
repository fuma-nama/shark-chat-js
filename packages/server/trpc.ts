import {
    inferRouterInputs,
    inferRouterOutputs,
    initTRPC,
    TRPCError,
} from "@trpc/server";
import { createContext } from "./context";
import {
    createTRPCUpstashLimiter,
    getFingerprintFromIP,
} from "./redis/ratelimit";
import { AppRouter } from "./routers/_app";

const t = initTRPC
    .context<Awaited<ReturnType<typeof createContext>>>()
    .create();

export type Context = Awaited<ReturnType<typeof createContext>>;
export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

const rateLimiter = createTRPCUpstashLimiter({
    fingerprint: (ctx) => getFingerprintFromIP(ctx.req),
    windowMs: 10 * 1000,
    message: (hitInfo) =>
        `Too many requests, please try again later. ${Math.ceil(
            (hitInfo.reset - Date.now()) / 1000
        )}`,
    max: 50,
    root: t,
});

export const router = t.router;
export const procedure = t.procedure.use(rateLimiter);

export const protectedProcedure = t.procedure
    .use(rateLimiter)
    .use(({ ctx, next }) => {
        if (ctx.session == null) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        return next({
            ctx: {
                ...ctx,
                session: ctx.session,
            },
        });
    });
