import { useGroupLayout } from "@/components/layout/group";
import { NextPageWithLayout } from "@/pages/_app";
import { useRouter } from "next/router";
import { getQuery } from ".";
import { Invite } from "@/components/chat/settings/invite";
import { Danger } from "@/components/chat/settings/danger";
import { Info } from "@/components/chat/settings/info";

const Settings: NextPageWithLayout = () => {
    const router = useRouter();
    const { groupId } = getQuery(router);

    return (
        <div className="flex flex-col gap-10 max-w-3xl">
            <Info group={groupId} />
            <Invite group={groupId} />
            <Danger group={groupId} />
        </div>
    );
};

Settings.useLayout = (children) =>
    useGroupLayout((group) => ({
        title: "Settings",
        breadcrumb: [{ href: `/chat/${group}/settings`, text: "Settings" }],
        children,
    }));
export default Settings;
