import { trpc } from "@/server/client";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import "@/styles/globals.css";
import { ReactElement, ReactNode } from "react";
import { NextPage } from "next";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout;
};

function App({
    Component,
    pageProps: { session, ...pageProps },
}: AppPropsWithLayout) {
    const getLayout = Component.getLayout ?? ((page) => page);

    return (
        <SessionProvider session={session}>
            <ThemeProvider attribute="class" disableTransitionOnChange>
                {getLayout(<Component {...pageProps} />)}
            </ThemeProvider>
        </SessionProvider>
    );
}

export default trpc.withTRPC(App);
