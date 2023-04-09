import Head from "next/head";
import { ReactNode } from "react";

export function BaseLayout({
    customMeta,
    children,
}: {
    children: ReactNode;
    customMeta?: boolean;
}) {
    return (
        <>
            <Head>
                {!customMeta && (
                    <>
                        <title>Shark Chat</title>
                        <meta name="description" content="A Simple chat app" />
                    </>
                )}
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className="flex flex-col min-h-full text-accent-900 dark:text-accent-50 bg-gradient-to-br from-brand-400 to-brand-500 p-4">
                {children}
            </main>
        </>
    );
}
