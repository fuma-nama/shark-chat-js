import { groupRouter } from "./group";
import { chatRouter } from "./chat";
import { z } from "zod";
import { procedure, router } from "../trpc";
import { accountRouter } from "./account";

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
    chat: chatRouter,
    group: groupRouter,
    account: accountRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
