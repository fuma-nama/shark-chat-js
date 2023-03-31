import { Avatar } from "@/components/system/avatar";
import { Button } from "@/components/system/button";
import { AppLayout } from "@/components/layout/app";
import { CreateGroupModal } from "@/components/modal/CreateGroupModal";
import { trpc } from "@/utils/trpc";
import { groupIcon } from "@/utils/media/format";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { NextPageWithLayout } from "./_app";
import Link from "next/link";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { JoinGroupModal } from "@/components/modal/JoinGroupModal";
import { RecentChatType } from "@/server/schema/chat";
import { Serialize } from "@/utils/types";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { GroupWithNotifications } from "@/server/schema/group";
import { channels } from "@/utils/ably";
import { useCallback } from "react";
import { useEventHandlers } from "@/utils/handlers/base";
import { useVariables } from "./chat/[group]";

const Home: NextPageWithLayout = () => {
    return (
        <>
            <h1 className="text-4xl font-bold">Recent Chat</h1>
            <div className="flex flex-row gap-3 mt-3">
                <CreateGroupModal>
                    <Button color="primary">Create Group</Button>
                </CreateGroupModal>
                <JoinGroupModal>
                    <Button>Join Group</Button>
                </JoinGroupModal>
                <Button className="text-accent-800 dark:text-accent-600 flex-1 justify-start">
                    <MagnifyingGlassIcon className="mr-2" />
                    Search...
                </Button>
            </div>
            <RecentChats />
            <h1 className="text-lg font-semibold mt-6">Chat Groups</h1>
            <Groups />
        </>
    );
};

function RecentChats() {
    const { status } = useSession();
    const query = trpc.dm.recentChats.useQuery(undefined, {
        enabled: status === "authenticated",
    });

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 mt-6">
            {query.data?.map((chat) => (
                <ChatItem key={chat.id} chat={chat} />
            ))}
        </div>
    );
}

function Groups() {
    const { status } = useSession();
    const groups = trpc.group.all.useQuery(undefined, {
        enabled: status === "authenticated",
        staleTime: Infinity,
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 mt-6 ">
            {groups.data?.map((group) => (
                <GroupItem key={group.id} group={group} />
            ))}
        </div>
    );
}

function GroupItem({ group }: { group: GroupWithNotifications }) {
    useNewMessageHandler(group.id);

    return (
        <Link
            href={`/chat/${group.id}`}
            className={clsx(
                "relative rounded-xl bg-light-50 dark:bg-dark-800 p-4 flex flex-col gap-4",
                "shadow-2xl dark:shadow-none shadow-brand-500/10"
            )}
        >
            <Avatar
                src={
                    group.icon_hash != null
                        ? groupIcon.url([group.id], group.icon_hash)
                        : null
                }
                alt="icon"
                fallback={group.name}
            />
            <p className="font-semibold text-lg overflow-hidden text-ellipsis max-w-full break-keep">
                {group.name}
            </p>
            {group.unread_messages > 0 && (
                <p
                    className={clsx(
                        "absolute top-4 right-4 px-2 py-[2px] rounded-full bg-brand-500 text-white text-sm font-semibold",
                        "dark:bg-brand-400"
                    )}
                >
                    {group.unread_messages}
                </p>
            )}
        </Link>
    );
}

function ChatItem({ chat }: { chat: Serialize<RecentChatType> }) {
    const user = chat.user;
    const url = `/dm/${user.id}`;

    return (
        <Link
            href={url}
            className={clsx(
                "rounded-xl bg-light-50 dark:bg-dark-800 p-4 flex flex-row gap-2",
                "shadow-2xl dark:shadow-none shadow-brand-500/10"
            )}
        >
            <Avatar src={user.image} fallback={user.name} />
            <div className="flex-1 w-0">
                <p className="font-semibold text-base">{user.name}</p>
                <p className="text-accent-700 dark:text-accent-600 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                    {chat.content}
                </p>
            </div>
        </Link>
    );
}

function useNewMessageHandler(groupId: number) {
    const base = useEventHandlers();
    const variables = useVariables(groupId);

    return channels.chat.message_sent.useChannel(
        [groupId],
        {},
        useCallback(
            (message) => {
                base.addGroupUnread(message.data.group_id);
                base.addGroupMessage(variables, message.data);
            },
            [base, variables]
        )
    );
}

Home.useLayout = (children) => (
    <AppLayout
        items={
            <div className="max-sm:hidden flex flex-row gap-3">
                <ThemeSwitch />
            </div>
        }
    >
        {children}
    </AppLayout>
);

export default Home;
