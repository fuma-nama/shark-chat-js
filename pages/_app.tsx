import { trpc } from "@/utils/trpc";
import { initClient } from "@/utils/ably/client";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { ReactElement } from "react";
import { ToastProvider } from "@/components/system/toast";
import {
    DirectMessageEventManager,
    MessageEventManager,
} from "@/utils/handlers/realtime/chat";
import { PrivateEventManager } from "@/utils/handlers/realtime/private";

import type { AppProps } from "next/app";
import type { NextPage } from "next";
import "cropperjs/dist/cropper.css";
import "@/styles/globals.css";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    useLayout?: (page: ReactElement) => ReactElement;
};

type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout;
};

function App({
    Component,
    pageProps: { session, ...pageProps },
}: AppPropsWithLayout) {
    return (
        <SessionProvider session={session}>
            <PrivateEventManager />
            <DirectMessageEventManager />
            <MessageEventManager />

            <ToastProvider />
            <ThemeProvider attribute="class" disableTransitionOnChange>
                <Content Component={Component} pageProps={pageProps} />
            </ThemeProvider>
        </SessionProvider>
    );
}

function Content({
    Component,
    pageProps,
}: Pick<AppPropsWithLayout, "Component" | "pageProps">) {
    const useLayout = Component.useLayout ?? ((page) => page);
    const layout = useLayout(<Component {...pageProps} />);

    return layout;
}

initClient();
export default trpc.withTRPC(App);
