import Avatar from "@/components/Avatar";
import { AppLayout } from "@/components/layout/app";
import { trpc } from "@/server/client";
import { groupIcon } from "@/utils/media";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { NextPageWithLayout } from "../_app";
import { CldImage } from "next-cloudinary";
import { ChatBubbleIcon, PaperPlaneIcon } from "@radix-ui/react-icons";
import { GetServerSideProps } from "next";
import Textarea from "@/components/input/Textarea";
import { useState } from "react";
import IconButton from "@/components/IconButton";
import clsx from "clsx";

type Props = {
    group: number;
};

const GroupChat: NextPageWithLayout<Props> = ({ group }) => {
    const { status } = useSession();
    const [text, setText] = useState("");
    const messages = trpc.chat.messages.useQuery(
        { groupId: group },
        { enabled: status === "authenticated" }
    );

    const send = trpc.chat.send.useMutation({
        onSuccess: (data) => {
            setText("");
            console.log(data);
        },
    });

    const onSend = () => {
        send.mutate({
            groupId: group,
            message: text,
        });
    };

    return (
        <>
            <div className="flex flex-col gap-3">
                {messages.data?.map((message) => (
                    <div
                        key={message.id}
                        className="p-3 rounded-xl bg-light-50 dark:bg-dark-800 flex flex-row gap-2"
                    >
                        <Avatar
                            src={message.author.image}
                            fallback={message.author.name!!}
                        />
                        <div>
                            <p className="font-semibold">
                                {message.author.name}
                            </p>
                            <p>{message.content}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="sticky bottom-0 pb-4 mt-auto bg-light-100 dark:bg-dark-900">
                <div
                    className={clsx(
                        "flex flex-row gap-3 bg-light-50 shadow-xl shadow-brand-500/10 dark:shadow-none dark:bg-dark-800 p-3 rounded-3xl",
                        "max-sm:-m-4 max-sm:rounded-none max-sm:gap-2"
                    )}
                >
                    <Textarea
                        id="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={Math.min(20, text.split("\n").length)}
                        wrap="virtual"
                        className="resize-none h-auto max-h-[50vh]"
                        placeholder="Type message"
                        autoComplete="off"
                        onKeyDown={(e) => {
                            if (e.shiftKey && e.key === "Enter") {
                                onSend();
                                e.preventDefault();
                            }
                        }}
                    />
                    <IconButton
                        type="submit"
                        disabled={send.isLoading || text.trim().length === 0}
                        className="aspect-square h-[41.6px]"
                        onClick={onSend}
                    >
                        <PaperPlaneIcon />
                    </IconButton>
                </div>
            </div>
        </>
    );
};

export const getServerSideProps: GetServerSideProps<Props> = async (props) => {
    const { group } = props.query;

    return {
        props: {
            group: Number(group),
        },
    };
};

GroupChat.useLayout = (children) => {
    const router = useRouter();
    const { group } = router.query;
    const { status } = useSession();
    const info = trpc.group.info.useQuery(
        { groupId: Number(group) },
        { enabled: status === "authenticated" }
    );

    return (
        <AppLayout
            title="Group Chat"
            breadcrumb={[
                {
                    text:
                        info.data != null ? (
                            <div className="flex flex-row gap-2 items-center">
                                {info.data.icon_hash != null ? (
                                    <CldImage
                                        src={groupIcon.url(
                                            [info.data.id],
                                            info.data.icon_hash
                                        )}
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
                        ) : (
                            <div className="w-28 h-5 rounded-lg bg-light-300 dark:bg-dark-700" />
                        ),
                    href: `/chat/${group}`,
                },
            ]}
        >
            {children}
        </AppLayout>
    );
};

export default GroupChat;
