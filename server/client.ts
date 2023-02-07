import { getBaseUrl, getBaseWSUrl } from "@/utils/get-base-url";
import { createWSClient, httpBatchLink, wsLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { NextPageContext } from "next";
import type { AppRouter } from "./routers/_app";

function getEndingLink(ctx: NextPageContext | undefined) {
    if (typeof window === "undefined") {
        return httpBatchLink({
            url: `${getBaseUrl()}/api/trpc`,
        });
    }
    return wsLink<AppRouter>({
        client: createWSClient({
            url: getBaseWSUrl(),
        }),
    });
}

export const trpc = createTRPCNext<AppRouter>({
    config({ ctx }) {
        return {
            links: [getEndingLink(ctx)],
        };
    },
    /**
     * @link https://trpc.io/docs/ssr
     **/
    ssr: true,
});
