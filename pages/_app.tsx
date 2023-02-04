import { client } from "@/gql";
import "@/styles/globals.css";
import { ApolloProvider } from "@apollo/client";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ApolloProvider client={client}>
            <ThemeProvider attribute="class">
                <Component {...pageProps} />
            </ThemeProvider>
        </ApolloProvider>
    );
}
