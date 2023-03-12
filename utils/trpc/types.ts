import type { AppRouter } from "@/server/routers/_app";
import type { inferRouterInputs } from "@trpc/server";

export type RouterInput = inferRouterInputs<AppRouter>;
