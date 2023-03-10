import { getQuery } from "@/pages/chat/[group]";
import { groupIcon } from "@/utils/media";
import { trpc } from "@/utils/trpc";
import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { CldImage } from "next-cloudinary";
import { useRouter } from "next/router";
import { ComponentProps } from "react";
import { AppLayout } from "./app";

function GroupItem({ group }: { group: number }) {
    const info = trpc.group.info.useQuery({ groupId: group });
    if (info.data == null) {
        return (
            <div className="w-28 h-5 rounded-lg bg-light-300 dark:bg-dark-700" />
        );
    }

    return (
        <div className="flex flex-row gap-2 items-center">
            {info.data.icon_hash != null ? (
                <CldImage
                    src={groupIcon.url([info.data.id], info.data.icon_hash)}
                    alt="icon"
                    width="28"
                    height="28"
                    className="rounded-full"
                />
            ) : (
                <ChatBubbleIcon className="w-7 h-7" />
            )}
            <span>{info.data.name}</span>
        </div>
    );
}

export function useGroupLayout(
    propsFn: (group: number) => ComponentProps<typeof AppLayout>
) {
    const router = useRouter();
    const group = getQuery(router).groupId;
    const props = propsFn(group);

    return (
        <AppLayout
            {...props}
            breadcrumb={[
                {
                    text: <GroupItem group={group} />,
                    href: `/chat/${group}`,
                },
                ...(props.breadcrumb ?? []),
            ]}
        >
            {props.children}
        </AppLayout>
    );
}
