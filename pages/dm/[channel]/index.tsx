import { Avatar } from "@/components/system/avatar";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { skeleton } from "@/components/system/skeleton";

import type { NextPageWithLayout } from "../../_app";
import { useDirectMessageLayout } from "@/components/layout/dm";
import { MessageList } from "@/components/chat/MessageList";
import { ChannelSendbar } from "@/components/chat/ChannelSendbar";

const DMPage: NextPageWithLayout = () => {
    const { channel } = useRouter().query as { channel: string };

    return <MessageList channelId={channel} welcome={<Welcome />} />;
};

function Welcome() {
    const { channel } = useRouter().query as { channel: string };
    const { status } = useSession();
    const query = trpc.dm.info.useQuery(
        { channelId: channel },
        { enabled: status === "authenticated" }
    );

    const data = query.data;
    return (
        <div className="flex flex-col gap-3 mb-10">
            <Avatar
                src={data?.user?.image}
                fallback={data?.user?.name}
                size="large"
            />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                {data?.user?.name ?? (
                    <span
                        className={skeleton({ className: "w-40 h-[40px]" })}
                    />
                )}
            </h1>
            <p className="text-accent-800 dark:text-accent-600 text-lg">
                Start your conversations with{" "}
                {data?.user?.name ?? (
                    <span
                        className={skeleton({
                            className: "align-middle",
                        })}
                    />
                )}
            </p>
        </div>
    );
}

DMPage.useLayout = (c) =>
    useDirectMessageLayout({
        children: c,
        footer: (
            <ChannelSendbar channelId={useRouter().query.channel as string} />
        ),
    });

export default DMPage;
