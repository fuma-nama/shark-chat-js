import { useRouter } from "next/router";
import { NextPageWithLayout } from "../../_app";
import { BookmarkIcon, GearIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import React from "react";
import { button } from "ui/components/button";
import Link from "next/link";
import { useGroupLayout } from "@/components/layout/group";
import { ChannelSendbar } from "@/components/chat/ChannelSendbar";
import { MessageList } from "@/components/chat/MessageList";
import { trpc } from "@/utils/trpc";

const GroupChat: NextPageWithLayout = () => {
    const channel_id = useChannelId();

    if (channel_id == null) return <></>;

    return <MessageList channelId={channel_id} welcome={<Welcome />} />;
};

function Welcome() {
    return (
        <div className="flex flex-col gap-3 mb-10">
            <BookmarkIcon
                className={clsx(
                    "w-10 h-10 md:w-20 md:h-20 bg-brand-500 p-2 rounded-xl text-accent-400",
                    "dark:bg-brand-400 dark:text-accent-50"
                )}
            />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                The beginning of this Story
            </h1>
            <p className="text-accent-800 dark:text-accent-600 text-lg">
                Let&apos;s send your first message here
            </p>
        </div>
    );
}

GroupChat.useLayout = (children) =>
    useGroupLayout({
        children,
        footer: useGroupSendbar(),
        items: (
            <Link
                href={{
                    pathname: "/chat/[group]/settings",
                    query: useRouter().query,
                }}
                className={button({
                    color: "secondary",
                    className: "gap-2",
                })}
            >
                <GearIcon /> Settings
            </Link>
        ),
    });

function useGroupSendbar() {
    const id = useChannelId();

    if (id == null) return <></>;
    return <ChannelSendbar channelId={id} />;
}

function useChannelId() {
    const group_id = useRouter().query.group;
    const query = trpc.group.all.useQuery(undefined);
    const group = query.data?.find((group) => group.id === Number(group_id));

    return group?.channel_id ?? null;
}

export default GroupChat;
