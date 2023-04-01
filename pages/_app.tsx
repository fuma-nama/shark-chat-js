import { trpc } from "@/utils/trpc";
import { ThemeProvider } from "next-themes";
import { SessionProvider, useSession } from "next-auth/react";
import { ReactElement, useEffect } from "react";
import { configureAbly } from "@ably-labs/react-hooks";
import { ToastProvider } from "@/components/system/toast";
import { PrivateEventManager } from "@/utils/handlers/realtime/private";
import {
    DirectMessageEventManager,
    MessageEventManager,
} from "@/utils/handlers/realtime/chat";
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

const prefix = process.env.API_ROOT || "";
const ably = configureAbly({
    authUrl: `${prefix}/api/ably/auth`,
    autoConnect: false,
});
ably.connection.on("connected", () => console.log("Ably Client connected"));
ably.connection.on("closed", () => console.log("Ably Client disconnected"));

function Connect() {
    const { status } = useSession();

    useEffect(() => {
        const connected = ably.connection.state === "connected";

        if (!connected && status === "authenticated") {
            ably.connect();
        }

        if (connected && status === "unauthenticated") {
            ably.close();
        }
    }, [status]);

    return (
        <>
            <PrivateEventManager />
            <DirectMessageEventManager />
            <MessageEventManager />
        </>
    );
}

function App({
    Component,
    pageProps: { session, ...pageProps },
}: AppPropsWithLayout) {
    return (
        <SessionProvider session={session}>
            <Connect />
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

export default trpc.withTRPC(App);
