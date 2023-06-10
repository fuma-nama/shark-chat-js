import { Avatar } from "ui/components/avatar";
import { Button } from "ui/components/button";
import { AppLayout } from "@/components/layout/app";
import { trpc } from "@/utils/trpc";
import { groupIcon } from "shared/media/format";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { NextPageWithLayout } from "./_app";
import Link from "next/link";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { DMChannel } from "@/utils/types";
import { GroupWithNotifications } from "shared/schema/group";
import { Spinner } from "ui/components/spinner";
import { BoxModelIcon } from "@radix-ui/react-icons";
import dynamic from "next/dynamic";
import { usePageStore } from "@/utils/stores/page";
import { useEffect } from "react";
import { DirectMessageContextMenu } from "@/components/menu/DirectMessageMenu";
import { useRouter } from "next/router";

const BoardingModal = dynamic(() => import("@/components/modal/BoardingModal"));
const CreateGroupModal = dynamic(
    () => import("@/components/modal/CreateGroupModal")
);
const JoinGroupModal = dynamic(
    () => import("@/components/modal/JoinGroupModal")
);

function Modals() {
    const router = useRouter();
    const { modal: initialModal } = router.query;
    const [modal, setModal] = usePageStore((s) => [s.modal, s.setModal]);

    useEffect(() => {
        if (initialModal === "new") {
            router.replace("/home", undefined, { shallow: true }).then(() => {
                setModal("boarding");
            });
        }
    }, [initialModal, router, setModal]);

    return (
        <>
            {modal === "create-group" && (
                <CreateGroupModal
                    open
                    setOpen={(open) =>
                        setModal(open ? "create-group" : undefined)
                    }
                />
            )}
            {modal === "join-group" && (
                <JoinGroupModal
                    open
                    setOpen={(open) =>
                        setModal(open ? "join-group" : undefined)
                    }
                />
            )}
            {modal === "boarding" && (
                <BoardingModal onCreateGroup={() => setModal("create-group")} />
            )}
        </>
    );
}

const Home: NextPageWithLayout = () => {
    const { status } = useSession();
    const setModal = usePageStore((s) => s.setModal);
    const dmQuery = trpc.dm.channels.useQuery(undefined, {
        enabled: status === "authenticated",
        staleTime: Infinity,
    });
    const groups = trpc.group.all.useQuery(undefined, {
        enabled: status === "authenticated",
        staleTime: Infinity,
    });

    const onRetry = () => {
        dmQuery.refetch();
        groups.refetch();
    };

    return (
        <>
            <Modals />
            <h1 className="text-4xl font-bold">Recent Chat</h1>
            <div className="flex flex-row gap-3 mt-3">
                <Button
                    color="primary"
                    onClick={() => setModal("create-group")}
                >
                    Create Group
                </Button>
                <Button onClick={() => setModal("join-group")}>
                    Join Group
                </Button>
            </div>

            {dmQuery.isLoading || groups.isLoading ? (
                <div className="m-auto">
                    <Spinner size="large" />
                </div>
            ) : dmQuery.isError || groups.isError ? (
                <div className="m-auto flex flex-col gap-3">
                    <h2 className="font-semibold text-lg text-foreground">
                        Failed to fetch info
                    </h2>
                    <Button color="danger" size="medium" onClick={onRetry}>
                        Retry
                    </Button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 mt-6">
                        {dmQuery.data.map((chat) => (
                            <ChatItem key={chat.id} chat={chat} />
                        ))}
                    </div>
                    <h1 className="text-lg font-semibold mt-6">Chat Groups</h1>
                    {groups.data.length === 0 ? (
                        <Placeholder />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 mt-6 ">
                            {groups.data.map((group) => (
                                <GroupItem key={group.id} group={group} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </>
    );
};

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
                src={groupIcon.url([group.id], group.icon_hash)}
                alt="icon"
                fallback={group.name}
            />
            <p className="font-semibold text-lg overflow-hidden text-ellipsis max-w-full break-keep">
                {group.name}
            </p>
            {group.unread_messages > 0 && (
                <p className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {group.unread_messages}
                </p>
            )}
        </Link>
    );
}

function ChatItem({ chat }: { chat: DMChannel }) {
    const user = chat.user;

    return (
        <DirectMessageContextMenu channelId={chat.id}>
            <Link
                href={`/dm/${chat.id}`}
                className={clsx(
                    "relative rounded-xl bg-light-50 dark:bg-dark-800 p-4 flex flex-row gap-2",
                    "shadow-2xl dark:shadow-none shadow-brand-500/10"
                )}
            >
                <Avatar src={user.image} fallback={user.name} size="2sm" />
                <div className="flex-1 w-0">
                    <p className="text-base font-medium text-foreground">
                        {user.name}
                    </p>
                </div>
                {chat.unread_messages > 0 && (
                    <p className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {chat.unread_messages}
                    </p>
                )}
            </Link>
        </DirectMessageContextMenu>
    );
}

function Placeholder() {
    return (
        <div className="flex flex-col items-center justify-center my-auto">
            <BoxModelIcon className="w-20 h-20 text-brand-500 dark:text-brand-400 max-md:hidden" />
            <p className="font-medium text-base text-foreground">
                Nothing here
            </p>
            <p className="text-muted-foreground text-sm">
                Try to find someone chat with you?
            </p>
        </div>
    );
}

Home.useLayout = (children) => (
    <AppLayout
        breadcrumb={[
            {
                href: "/home",
                text: "Home",
            },
        ]}
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
