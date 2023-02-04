import { client } from "@/gql";
import { ApolloProvider } from "@apollo/client";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import "@/styles/globals.css";

export default function App({
    Component,
    pageProps: { session, ...pageProps },
}: AppProps) {
    return (
        <SessionProvider session={session}>
            <ApolloProvider client={client}>
                <ThemeProvider attribute="class" disableTransitionOnChange>
                    <Component {...pageProps} />
                </ThemeProvider>
            </ApolloProvider>
        </SessionProvider>
    );
}
