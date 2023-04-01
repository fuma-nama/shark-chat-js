import { trpc } from "@/utils/trpc";
import { ThemeProvider } from "next-themes";
import { SessionProvider, useSession } from "next-auth/react";
import { ReactElement, useEffect } from "react";
import { ToastProvider } from "@/components/system/toast";
import {
    DirectMessageEventManager,
    MessageEventManager,
} from "@/utils/handlers/realtime/chat";
import { assertConfiguration } from "@ably-labs/react-hooks";
import { PrivateEventManager } from "@/utils/handlers/realtime/private";

import type { AppProps } from "next/app";
import type { NextPage } from "next";

import "cropperjs/dist/cropper.css";
import "@/styles/globals.css";
import "@/utils/ably/configure";

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
            <RealtimeHandlers />
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

function RealtimeHandlers() {
    const ably = assertConfiguration();
    const { status } = useSession();

    useEffect(() => {
        const connected = ably.connection.state === "connected";

        if (!connected && status === "authenticated") {
            ably.connect();
        }

        if (connected && status === "unauthenticated") {
            ably.close();
        }
    }, [ably, status]);

    return (
        <>
            <PrivateEventManager />
            <DirectMessageEventManager />
            <MessageEventManager />
        </>
    );
}

export default trpc.withTRPC(App);
