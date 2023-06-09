import { trpc } from "@/utils/trpc";
import { AblyClientProvider } from "@/utils/ably/client";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { ReactElement } from "react";
import { MessageEventManager } from "@/utils/handlers/realtime/chat";
import { GroupEventManager } from "@/utils/handlers/realtime/group";
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
            <AblyClientProvider />
            <PrivateEventManager />
            <GroupEventManager />
            <MessageEventManager />

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
