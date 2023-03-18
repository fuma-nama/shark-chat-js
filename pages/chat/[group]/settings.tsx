import { Avatar } from "@/components/system/avatar";
import { Button } from "@/components/system/button";
import { useGroupLayout } from "@/components/layout/group";
import { NextPageWithLayout } from "@/pages/_app";
import { groupIcon } from "@/utils/media/format";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";
import { useState } from "react";
import { getQuery } from ".";
import { Invite } from "@/components/chat/settings/invite";
import { Danger } from "@/components/chat/settings/danger";
import { EditGroupPanel } from "@/components/chat/settings/info";

const Settings: NextPageWithLayout = () => {
    const router = useRouter();
    const { groupId } = getQuery(router);
    const query = trpc.group.info.useQuery({ groupId });
    const [edit, setEdit] = useState(false);

    if (query.data == null) {
        return <></>;
    }

    if (edit)
        return (
            <EditGroupPanel
                group={query.data}
                onCancel={() => setEdit(false)}
            />
        );

    const info = query.data;
    return (
        <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-3">
                <Avatar
                    size="large"
                    src={
                        info.icon_hash != null
                            ? groupIcon.url([groupId], info.icon_hash)
                            : null
                    }
                    fallback={info.name}
                />
                <h2 className="text-2xl font-bold">{info.name}</h2>

                <div className="flex flex-row gap-3">
                    <Button color="primary" onClick={() => setEdit(true)}>
                        Edit Info
                    </Button>
                </div>
            </div>

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
