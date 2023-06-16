import Sidebar from "@/components/layout/Sidebar";
import Head from "next/head";
import React, { ComponentProps } from "react";
import { ReactNode } from "react";
import { trpc } from "@/utils/trpc";
import { Spinner } from "ui/components/spinner";

export function AppLayout({
    children,
    root,
}: {
    children: ReactNode;
    root?: Omit<ComponentProps<"div">, "className">;
}) {
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
                    {...root}
                    className="overflow-y-auto flex flex-col max-h-full"
                >
                    {children}
                </div>
            </main>
        </>
    );
}

export function Content({ children }: { children: ReactNode }) {
    const groupQuery = trpc.group.all.useQuery(undefined, {
        enabled: false,
    });
    const dmQuery = trpc.dm.channels.useQuery(undefined, {
        enabled: false,
    });

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
