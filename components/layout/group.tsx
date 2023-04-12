import { getGroupQuery } from "@/utils/variables";
import { groupIcon } from "@/utils/media/format";
import { trpc } from "@/utils/trpc";
import Router, { useRouter } from "next/router";
import { ComponentProps } from "react";
import { Avatar } from "../system/avatar";
import { AppLayout } from "./app";
import { useSession } from "next-auth/react";

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
                src={
                    info.data.icon_hash != null
                        ? groupIcon.url([info.data.id], info.data.icon_hash)
                        : null
                }
                alt="icon"
                fallback={info.data.name}
            />
            <span>{info.data.name}</span>
        </div>
    );
}

export function useGroupLayout(props: ComponentProps<typeof AppLayout>) {
    return (
        <AppLayout
            {...props}
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
