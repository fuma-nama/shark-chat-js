"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { useState } from "react";
import { trpc } from "./app-router";
import { showErrorToast } from "../stores/page";
import { getBaseUrl } from "../get-base-url";

export const TrpcProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: false,
                        retryOnMount: false,
                    },
                    mutations: {
                        retry: false,
                        onError(error) {
                            if (error instanceof TRPCClientError) {
                                showErrorToast({
                                    title: "Unknown Error",
                                    description: error.message,
                                });
                            }
                        },
                    },
                },
            })
    );
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: `${getBaseUrl()}/api/trpc`,
                }),
            ],
        })
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </trpc.Provider>
    );
};
