import Sidebar from "@/components/layout/Sidebar";
import Head from "next/head";
import React, { RefObject, createContext } from "react";
import { ReactNode } from "react";
import { BreadcrumbItem } from "./Breadcrumbs";
import { Navbar } from "./Navbar";
import { useViewScrollController } from "ui/hooks/use-bottom-scroll";
import { trpc } from "@/utils/trpc";
import { Spinner } from "ui/components/spinner";

export const ViewContext = createContext<
    | {
          viewRef: RefObject<HTMLDivElement>;
          scrollToBottom: () => void;
      }
    | undefined
>(undefined);

export function AppLayout({
    items,
    children,
    breadcrumb,
    footer,
}: {
    breadcrumb: BreadcrumbItem[];
    items?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
}) {
    const { handleRootScroll, rootRef, scrollToBottom } =
        useViewScrollController();

    return (
        <>
            <Head>
                <title>Shark Chat Beta</title>
                <meta name="description" content="A Simple chat app" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className="grid grid-cols-1 md:grid-cols-[20rem_auto] h-full max-h-full overflow-hidden">
                <Sidebar />
                <div
                    className="overflow-y-auto flex flex-col max-h-full"
                    ref={rootRef}
                    onScroll={handleRootScroll}
                >
                    <Navbar breadcrumb={breadcrumb}>{items}</Navbar>

                    <ViewContext.Provider
                        value={{ viewRef: rootRef, scrollToBottom }}
                    >
                        <Content>{children}</Content>
                        {footer}
                    </ViewContext.Provider>
                </div>
            </main>
        </>
    );
}

function Content({ children }: { children: ReactNode }) {
    const groupQuery = trpc.group.all.useQuery();
    const dmQuery = trpc.dm.channels.useQuery();

    if (groupQuery.isLoading || dmQuery.isLoading) {
        return (
            <div className="m-auto">
                <Spinner size="large" />
            </div>
        );
    }

    return (
        <div className="max-w-screen-2xl w-full mx-auto flex flex-col flex-1 pt-2 p-4">
            {children}
        </div>
    );
}
