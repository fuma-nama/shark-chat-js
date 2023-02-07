import { z } from "zod";
import { procedure, protectedProcedure, router } from "../trpc";

export const appRouter = router({
    hello: procedure
        .input(
            z.object({
                text: z.string(),
            })
        )
        .query(({ input }) => {
            return {
                greeting: `hello ${input.text}`,
            };
        }),
    name: protectedProcedure.query(({ ctx }) => {
        return ctx.session?.user.name;
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
