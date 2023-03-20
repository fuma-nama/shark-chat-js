import { Avatar } from "@/components/system/avatar";
import { Button } from "@/components/system/button";
import { IconButton } from "@/components/system/button";
import { AppLayout } from "@/components/layout/app";
import { CreateGroupModal } from "@/components/modal/CreateGroupModal";
import { trpc } from "@/utils/trpc";
import { groupIcon } from "@/utils/media/format";
import { PlusIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { NextPageWithLayout } from "./_app";
import Link from "next/link";
import { Group } from "@prisma/client";
import useProfile from "@/utils/use-profile";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { JoinGroupModal } from "@/components/modal/JoinGroupModal";

const Home: NextPageWithLayout = () => {
    return (
        <>
            <h1 className="text-4xl font-bold">Recent Chat</h1>
            <div className="flex flex-row gap-3 mt-6">
                <CreateGroupModal>
                    <Button color="primary">Create Group</Button>
                </CreateGroupModal>
                <JoinGroupModal>
                    <Button>Join Group</Button>
                </JoinGroupModal>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 mt-6">
                <ChatItem />
                <ChatItem />
                <ChatItem />
                <ChatItem />
            </div>
            <h1 className="text-lg font-semibold mt-6">Chat Groups</h1>
            <Groups />
            <div className="fixed bottom-6 right-6 sm:hidden">
                <CreateGroupModal>
                    <IconButton aria-label="Create Group">
                        <PlusIcon className="w-7 h-7" />
                    </IconButton>
                </CreateGroupModal>
            </div>
        </>
    );
};

function Groups() {
    const { status } = useSession();
    const groups = trpc.group.all.useQuery(undefined, {
        enabled: status === "authenticated",
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 mt-6 ">
            {groups.data?.map((group) => (
                <GroupItem key={group.id} group={group} />
            ))}
        </div>
    );
}

function GroupItem({ group }: { group: Group }) {
    return (
        <Link
            href={`/chat/${group.id}`}
            className={clsx(
                "rounded-xl bg-light-50 dark:bg-dark-800 p-4 flex flex-col gap-4",
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
        </Link>
    );
}

function ChatItem() {
    const { profile } = useProfile();

    if (profile == null) return <></>;

    return (
        <div
            className={clsx(
                "rounded-xl bg-light-50 dark:bg-dark-800 p-4 flex flex-row gap-2",
                "shadow-2xl dark:shadow-none shadow-brand-500/10"
            )}
        >
            <Avatar src={profile.image} fallback={profile.name} />
            <div>
                <p className="font-semibold text-base">{profile.name}</p>
                <p className="text-accent-700 dark:text-accent-600 text-sm">
                    Sleeping
                </p>
            </div>
        </div>
    );
}

Home.useLayout = (children) => (
    <AppLayout
        title="Home"
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
