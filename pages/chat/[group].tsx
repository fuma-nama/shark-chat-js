import { AppLayout } from "@/components/layout/app";
import { useRouter } from "next/router";
import { NextPageWithLayout } from "../_app";

const GroupChat: NextPageWithLayout = () => {
    return <></>;
};

GroupChat.getLayout = function Layout(children) {
    const router = useRouter();
    const { group } = router.query;

    return (
        <AppLayout
            title="Group Chat"
            breadcrumb={[{ text: "Group", href: `/chat/${group}` }]}
        >
            {children}
        </AppLayout>
    );
};

export default GroupChat;
