import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import { AppLayout } from "@/components/layout/app";
import { CreateGroupModal } from "@/components/modal/CreateGroupModal";
import { trpc } from "@/server/client";
import { useTypedChannelEvent } from "@/utils/ably/hooks";
import { groupIcon } from "@/utils/media";
import { ChatBubbleIcon, PlusIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { NextPageWithLayout } from "./_app";
import { CldImage } from "next-cloudinary";

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
    const { status } = useSession();
    const groups = trpc.group.all.useQuery(undefined, {
        enabled: status === "authenticated",
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mt-6 ">
            {groups.data?.map((group) => (
                <div
                    key={group.id}
                    className={clsx(
                        "rounded-xl bg-light-50 dark:bg-dark-800 p-4 flex flex-col gap-4",
                        "shadow-2xl dark:shadow-none shadow-brand-500/10"
                    )}
                >
                    {group.icon_hash != null ? (
                        <CldImage
                            width="60"
                            height="60"
                            alt="icon"
                            src={groupIcon(
                                group.id.toString(),
                                group.icon_hash
                            )}
                            className="rounded-xl bg-brand-500 dark:bg-brand-400"
                        />
                    ) : (
                        <ChatBubbleIcon className="w-[60px] h-[60px] text-accent-50 bg-brand-500 dark:bg-brand-400 rounded-xl flex items-center justify-center p-4" />
                    )}
                    <p className="font-semibold text-lg overflow-hidden text-ellipsis max-w-full break-keep">
                        {group.name}
                    </p>
                </div>
            ))}
        </div>
    );
}

function ChatItem() {
    const [latest, setLatest] = useState("");

    const send = trpc.chat.send.useMutation();
    const user = useSession().data?.user;

    useTypedChannelEvent(
        {
            channel: ["private", user?.id ?? ""],
            event: "message_sent",
            enabled: user != null,
        },
        (message) => {
            console.log(message);

            setLatest(message.data.message);
        }
    );

    if (user == null) return <></>;

    return (
        <div
            className={clsx(
                "rounded-xl bg-light-50 dark:bg-dark-800 p-4 flex flex-row gap-2",
                "shadow-2xl dark:shadow-none shadow-brand-500/10"
            )}
            onClick={() => send.mutate({ message: "Hello World" })}
        >
            <Avatar
                alt="avatar"
                src={user.image ?? undefined}
                fallback={user.name ?? undefined}
            />
            <div>
                <p className="font-semibold text-base">SonMooSans</p>
                <p className="text-accent-700 dark:text-accent-600 text-sm">
                    Sleeping {latest}
                </p>
            </div>
        </div>
    );
}

Home.getLayout = (children) => (
    <AppLayout
        title="Home"
        items={
            <>
                <CreateGroupModal>
                    <Button variant="primary">Create Group</Button>
                </CreateGroupModal>
            </>
        }
    >
        {children}
    </AppLayout>
);

export default Home;
