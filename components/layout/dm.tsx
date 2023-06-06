import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { badge } from "../system/badge";
import { siderbarItem } from "./Sidebar";
import { AppLayout } from "./app";
import { ReactNode } from "react";
import { skeleton } from "../system/skeleton";
import { Avatar } from "../system/avatar";
import { text } from "../system/text";
import { DirectMessageContextMenu } from "../menu/DirectMessageMenu";
import { DMChannel } from "@/server/schema/chat";

export function useDirectMessageLayout({
    footer,
    children,
}: {
    footer: ReactNode;
    children: ReactNode;
}) {
    const router = useRouter();

    return (
        <AppLayout
            footer={footer}
            sidebar={<Sidebar />}
            breadcrumb={[
                {
                    text: <BreadcrumbItem />,
                    href: router.asPath,
                },
            ]}
        >
            {children}
        </AppLayout>
    );
}

function BreadcrumbItem() {
    const { channel } = useRouter().query as { channel: string };
    const { status } = useSession();
    const query = trpc.dm.info.useQuery(
        { channelId: channel },
        { enabled: status === "authenticated" }
    );

    return query.data == null ? (
        <div className={skeleton()} />
    ) : (
        <div className="flex flex-row gap-2 items-center">
            <Avatar
                src={query.data.user.image}
                fallback={query.data.user.name}
                size="small"
            />
            <span>{query.data.user.name}</span>
        </div>
    );
}

function Sidebar() {
    const { status } = useSession();
    const query = trpc.dm.channels.useQuery(undefined, {
        staleTime: Infinity,
        enabled: status === "authenticated",
    });

    return (
        <div className="flex flex-col mt-3">
            <p
                className={text({
                    type: "primary",
                    size: "md",
                    className: "mb-2",
                })}
            >
                Direct Messages
            </p>
            {query.status === "loading" && (
                <>
                    <div className="rounded-lg bg-light-200 dark:bg-dark-700 my-2 h-[32px]" />
                    <div className="rounded-lg bg-light-200 dark:bg-dark-700 my-2 h-[32px]" />
                    <div className="rounded-lg bg-light-200 dark:bg-dark-700 my-2 h-[32px]" />
                    <div className="rounded-lg bg-light-200 dark:bg-dark-700 my-2 h-[32px]" />
                </>
            )}
            {query.data?.map((item) => (
                <ChatItem key={item.id} item={item} />
            ))}
        </div>
    );
}

function ChatItem({ item }: { item: DMChannel }) {
    const router = useRouter();
    const active = router.query["channel"] === item.id;
    const styles = siderbarItem({ active });

    return (
        <DirectMessageContextMenu channelId={item.id}>
            <Link href={`/dm/${item.id}`} className={styles.root()}>
                <Avatar
                    rounded="sm"
                    size="2sm"
                    fallback={item.user.name}
                    src={item.user.image}
                />
                <p className={styles.text()}>{item.user.name}</p>
                {item.unread_messages !== 0 && (
                    <div className={badge({ className: "ml-auto" })}>
                        {item.unread_messages}
                    </div>
                )}
            </Link>
        </DirectMessageContextMenu>
    );
}
