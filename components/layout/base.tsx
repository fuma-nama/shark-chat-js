import clsx from "clsx";
import Head from "next/head";
import { ReactNode } from "react";

export function BaseLayout({
    customMeta,
    children,
    variant = "brand",
}: {
    children: ReactNode;
    customMeta?: boolean;
    variant?: "brand" | "base";
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
            <main
                className={clsx(
                    "flex flex-col min-h-full text-accent-900 dark:text-accent-50 p-4",
                    {
                        "bg-gradient-to-br from-brand-400 to-brand-500":
                            variant === "brand",
                        "bg-light-50 dark:bg-dark-900": variant === "base",
                    }
                )}
            >
                {children}
            </main>
        </>
    );
}
