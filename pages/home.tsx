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
import { GroupWithNotifications } from "@/server/schema/group";
import { badge } from "@/components/system/badge";

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
            </div>
            <RecentChats />
            <h1 className="text-lg font-semibold mt-6">Chat Groups</h1>
            <Groups />
        </>
    );
};

function RecentChats() {
    const { status } = useSession();
    const query = trpc.dm.channels.useQuery(undefined, {
        enabled: status === "authenticated",
    });

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 mt-6">
            {query.data?.map((chat) => (
                <ChatItem key={chat.receiver_id} chat={chat} />
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
                <p className={badge()}>{group.unread_messages}</p>
            )}
        </Link>
    );
}

function ChatItem({ chat }: { chat: Serialize<RecentChatType> }) {
    const user = chat.receiver;
    const url = `/dm/${user.id}`;

    return (
        <Link
            href={url}
            className={clsx(
                "relative rounded-xl bg-light-50 dark:bg-dark-800 p-4 flex flex-row gap-2",
                "shadow-2xl dark:shadow-none shadow-brand-500/10"
            )}
        >
            <Avatar src={user.image} fallback={user.name} />
            <div className="flex-1 w-0">
                <p className="font-semibold text-base">{user.name}</p>
                <p className="text-accent-700 dark:text-accent-600 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                    {chat.last_message}
                </p>
            </div>
            {chat.unread_messages > 0 && (
                <p className={badge()}>{chat.unread_messages}</p>
            )}
        </Link>
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
