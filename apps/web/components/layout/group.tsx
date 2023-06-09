import { getGroupQuery } from "@/utils/variables";
import { groupIcon } from "@/utils/media/format";
import { trpc } from "@/utils/trpc";
import Router, { useRouter } from "next/router";
import { ComponentProps } from "react";
import { Avatar } from "../system/avatar";
import { AppLayout } from "./app";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { badge } from "../system/badge";
import { siderbarItem } from "./Sidebar";

function GroupItem() {
    const { status } = useSession();
    const { groupId, isReady } = getGroupQuery(useRouter());

    const info = trpc.group.info.useQuery(
        { groupId },
        {
            enabled: status === "authenticated" && isReady,
            onError(err) {
                if (err.data?.code === "NOT_FOUND") {
                    Router.push("/");
                }
            },
        }
    );

    if (info.data == null) {
        return (
            <div className="w-28 h-5 rounded-lg bg-light-300 dark:bg-dark-700" />
        );
    }

    return (
        <div className="flex flex-row gap-2 items-center">
            <Avatar
                size="small"
                src={groupIcon.url([info.data.id], info.data.icon_hash)}
                alt="icon"
                fallback={info.data.name}
            />
            <span>{info.data.name}</span>
        </div>
    );
}

export function useGroupLayout(
    props: Partial<ComponentProps<typeof AppLayout>>
) {
    return (
        <AppLayout
            {...props}
            sidebar={<Sidebar />}
            breadcrumb={[
                {
                    text: <GroupItem />,
                    href: `/chat/[group]`,
                },
                ...(props.breadcrumb ?? []),
            ]}
        >
            {props.children}
        </AppLayout>
    );
}

function Sidebar() {
    const router = useRouter();
    const { status } = useSession();
    const query = trpc.group.all.useQuery(undefined, {
        staleTime: Infinity,
        enabled: status === "authenticated",
    });

    return (
        <div className="flex flex-col mt-3">
            <p className="font-medium text-base text-primary-foreground">
                Chats
            </p>
            {query.status === "loading" && (
                <>
                    <div className="rounded-lg bg-light-200 dark:bg-dark-700 my-2 h-[32px]" />
                    <div className="rounded-lg bg-light-200 dark:bg-dark-700 my-2 h-[32px]" />
                    <div className="rounded-lg bg-light-200 dark:bg-dark-700 my-2 h-[32px]" />
                    <div className="rounded-lg bg-light-200 dark:bg-dark-700 my-2 h-[32px]" />
                </>
            )}
            {query.data?.map((item) => {
                const active = router.query["group"] === item.id.toString();
                const styles = siderbarItem({ active });

                return (
                    <Link
                        key={item.id}
                        href={`/chat/${item.id}`}
                        className={styles.root()}
                    >
                        <Avatar
                            rounded="sm"
                            size="2sm"
                            fallback={item.name}
                            src={groupIcon.url([item.id], item.icon_hash)}
                        />
                        <p className={styles.text()}>{item.name}</p>
                        {item.unread_messages !== 0 && (
                            <div className={badge({ className: "ml-auto" })}>
                                {item.unread_messages}
                            </div>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
