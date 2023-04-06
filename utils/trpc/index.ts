import { getBaseUrl } from "@/utils/get-base-url";
import { TRPCClientError, httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import type { inferRouterInputs } from "@trpc/server";
import type { AppRouter } from "../../server/routers/_app";
import { showErrorToast } from "../stores/page";

export const trpc = createTRPCNext<AppRouter>({
    config() {
        return {
            queryClientConfig: {
                defaultOptions: {
                    queries: {
                        retry: false,
                    },
                    mutations: {
                        onError(error) {
                            if (error instanceof TRPCClientError) {
                                showErrorToast({
                                    title: "Unknown Error",
                                    description: error.message,
                                    variant: "red",
                                });
                            }
                        },
                    },
                },
            },
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
