import type { AppRouter } from "server/routers/_app";
import type { CreateReactUtilsProxy } from "@trpc/react-query/shared";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();

export type { RouterInput, RouterOutput } from "server/trpc";
export type RouterUtils = CreateReactUtilsProxy<AppRouter, unknown>;
