import { initTRPC, TRPCError } from "@trpc/server";
import { createContext } from "./context";

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC
    .context<Awaited<ReturnType<typeof createContext>>>()
    .create();

// Base router and procedure helpers
export const router = t.router;
export const procedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
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
