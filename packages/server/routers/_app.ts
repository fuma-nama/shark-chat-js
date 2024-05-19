import { groupRouter } from "./group/group";
import { chatRouter } from "./chat";
import { router } from "../trpc";
import { accountRouter } from "./account";
import { uploadRouter } from "./upload";
import { dmRouter } from "./dm";
import { emotesRouter } from "./emotes";

export const appRouter = router({
  chat: chatRouter,
  group: groupRouter,
  account: accountRouter,
  upload: uploadRouter,
  dm: dmRouter,
  emotes: emotesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
