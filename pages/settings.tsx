import Avatar from "@/components/Avatar";
import { AppLayout } from "@/components/layout/app";
import { useSession } from "next-auth/react";
import { NextPageWithLayout } from "./_app";

const Settings: NextPageWithLayout = () => {
    const { status, data } = useSession();
    const user = data?.user;
    if (status !== "authenticated" || user == null) return <></>;

    return (
        <>
            <Avatar
                variant="large"
                alt="avatar"
                src={user.image ?? undefined}
                fallback={user.name ?? undefined}
            />
            <h2 className="font-bold text-2xl">{user.name}</h2>
        </>
    );
};

Settings.getLayout = (children) => (
    <AppLayout title="Settings">{children}</AppLayout>
);

export default Settings;
