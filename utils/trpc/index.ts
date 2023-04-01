import { getBaseUrl } from "@/utils/get-base-url";
import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import type { inferRouterInputs } from "@trpc/server";
import type { AppRouter } from "../../server/routers/_app";

export const trpc = createTRPCNext<AppRouter>({
    config() {
        return {
            links: [
                httpBatchLink({
                    url: `${getBaseUrl()}/api/trpc`,
                }),
            ],
        };
    },
    ssr: false,
});

export type RouterInput = inferRouterInputs<AppRouter>;
