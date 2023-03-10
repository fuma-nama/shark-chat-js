import Avatar from "@/components/system/avatar";
import { Button } from "@/components/system/button";
import { IconButton } from "@/components/system/button";
import { AppLayout } from "@/components/layout/app";
import { CreateGroupModal } from "@/components/modal/CreateGroupModal";
import { trpc } from "@/utils/trpc";
import { groupIcon } from "@/utils/media";
import { PlusIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { NextPageWithLayout } from "./_app";
import { channels } from "@/utils/ably";
import Link from "next/link";
import { Group } from "@prisma/client";
import useProfile from "@/utils/auth/use-profile";

const Home: NextPageWithLayout = () => {
    return (
        <>
            <h1 className="text-4xl font-bold">Recent Chat</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 mt-6">
                <ChatItem />
                <ChatItem />
                <ChatItem />
                <ChatItem />
            </div>
            <h1 className="text-lg font-semibold mt-6">Chat Groups</h1>
            <Groups />
            <div className="fixed bottom-6 right-6 md:hidden">
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
    const { status, data } = useSession();
    const utils = trpc.useContext();
    const groups = trpc.group.all.useQuery(undefined, {
        enabled: status === "authenticated",
    });

    channels.private.group_created.useChannel(
        [data?.user?.id ?? ""],
        {
            enabled: status === "authenticated",
        },
        (message) => {
            console.log(message);
            utils.group.all.setData(undefined, (groups) =>
                groups != null ? [...groups, message.data] : undefined
            );
        }
    );

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
                <p className="font-semibold text-base">SonMooSans</p>
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
            <>
                <CreateGroupModal>
                    <Button color="primary">Create Group</Button>
                </CreateGroupModal>
            </>
        }
    >
        {children}
    </AppLayout>
);

export default Home;
