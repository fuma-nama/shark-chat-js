import Avatar from "@/components/Avatar";
import { AppLayout } from "@/components/layout/app";
import { trpc } from "@/server/client";
import { groupIcon } from "@/utils/media";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { NextPageWithLayout } from "../_app";
import { CldImage } from "next-cloudinary";
import { ChatBubbleIcon } from "@radix-ui/react-icons";

const GroupChat: NextPageWithLayout = () => {
    return <></>;
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
