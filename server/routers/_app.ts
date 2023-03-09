import { groupRouter } from "./group";
import { chatRouter } from "./chat";
import { router } from "../trpc";
import { accountRouter } from "./account";
import { uploadRouter } from "./upload";

export const appRouter = router({
    chat: chatRouter,
    group: groupRouter,
    account: accountRouter,
    upload: uploadRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
