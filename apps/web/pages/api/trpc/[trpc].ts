import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter } from "server/routers/_app";
import { createContext } from "server/context";

export default createNextApiHandler({
    router: appRouter,
    createContext,
});

export const config = {
    api: {
        bodyParser: {
            sizeLimit: "5mb",
        },
    },
};
