import { client } from "@/gql";
import { ApolloProvider } from "@apollo/client";
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

export default function App({
    Component,
    pageProps: { session, ...pageProps },
}: AppPropsWithLayout) {
    const getLayout = Component.getLayout ?? ((page) => page);

    return (
        <SessionProvider session={session}>
            <ApolloProvider client={client}>
                <ThemeProvider attribute="class" disableTransitionOnChange>
                    {getLayout(<Component {...pageProps} />)}
                </ThemeProvider>
            </ApolloProvider>
        </SessionProvider>
    );
}
