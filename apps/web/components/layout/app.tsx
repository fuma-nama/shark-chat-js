import Sidebar from "@/components/layout/Sidebar";
import clsx from "clsx";
import Head from "next/head";
import React, { RefObject, createContext } from "react";
import { ReactNode } from "react";
import { BreadcrumbItem } from "./Breadcrumbs";
import { Navbar } from "./Navbar";
import { useViewScrollController } from "@/utils/hooks/use-bottom-scroll";

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
    sidebar,
}: {
    breadcrumb: BreadcrumbItem[];
    items?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    sidebar?: ReactNode;
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
            <main
                className={clsx(
                    "grid grid-cols-1 md:grid-cols-[20rem_auto] h-full max-h-full overflow-hidden text-accent-900 bg-light-100",
                    "dark:text-accent-50 dark:bg-dark-900"
                )}
            >
                <Sidebar>{sidebar}</Sidebar>
                <div
                    className="overflow-y-auto flex flex-col max-h-full"
                    ref={rootRef}
                    onScroll={handleRootScroll}
                >
                    <Navbar breadcrumb={breadcrumb}>{items}</Navbar>
                    <ViewContext.Provider
                        value={{ viewRef: rootRef, scrollToBottom }}
                    >
                        <div className="max-w-screen-2xl w-full mx-auto flex flex-col flex-1 pt-2 p-4">
                            {children}
                        </div>
                        {footer}
                    </ViewContext.Provider>
                </div>
            </main>
        </>
    );
}