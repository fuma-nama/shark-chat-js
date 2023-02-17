import { AppLayout } from "@/components/layout/app";
import { trpc } from "@/server/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { NextPageWithLayout } from "../_app";

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
                { text: info.data?.name ?? "Group", href: `/chat/${group}` },
            ]}
        >
            {children}
        </AppLayout>
    );
};

export default GroupChat;
