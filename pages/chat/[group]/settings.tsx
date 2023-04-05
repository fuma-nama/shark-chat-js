import { useGroupLayout } from "@/components/layout/group";
import { NextPageWithLayout } from "@/pages/_app";
import { useRouter } from "next/router";
import Info from "@/components/chat/settings/info";
import { useIsGroupAdmin } from "@/utils/trpc/is-group-admin";
import { Spinner } from "@/components/system/spinner";
import { getGroupQuery } from "@/utils/variables";
import { Tabs, TabsContent } from "@/components/system/tabs";
import dynamic from "next/dynamic";
import { LeaveGroup } from "@/components/chat/settings/danger";
import Members from "@/components/chat/settings/members";
import { text } from "@/components/system/text";

const Invite = dynamic(() => import("@/components/chat/settings/invite"));
const Danger = dynamic(() => import("@/components/chat/settings/danger"));

const Settings: NextPageWithLayout = () => {
    const router = useRouter();
    const { groupId, isReady } = getGroupQuery(router);
    const isAdmin = useIsGroupAdmin({ groupId });

    return (
        <div className="flex flex-col gap-10 max-w-3xl">
            {isAdmin.loading ? (
                <Spinner size="large" />
            ) : (
                <>
                    <Info
                        group={groupId}
                        isAdmin={isAdmin.value}
                        isReady={isReady}
                    />
                    {isAdmin.value && (
                        <Tabs
                            defaultValue="invite"
                            items={[
                                { text: "Invite", value: "invite" },
                                { text: "Member", value: "member" },
                                { text: "Danger", value: "danger" },
                            ]}
                        >
                            <TabsContent value="invite" className="mt-5">
                                <Invite group={groupId} />
                            </TabsContent>
                            <TabsContent value="member" className="mt-5">
                                <Members group={groupId} isAdmin />
                            </TabsContent>
                            <TabsContent value="danger" className="mt-5">
                                <Danger group={groupId} />
                            </TabsContent>
                        </Tabs>
                    )}
                    {!isAdmin.value && (
                        <>
                            <div>
                                <h2
                                    className={text({
                                        size: "md",
                                        type: "primary",
                                        className: "mb-3",
                                    })}
                                >
                                    Members
                                </h2>
                                <Members group={groupId} isAdmin={false} />
                            </div>

                            <LeaveGroup group={groupId} />
                        </>
                    )}
                </>
            )}
        </div>
    );
};

Settings.useLayout = (children) =>
    useGroupLayout((group) => ({
        breadcrumb: [{ href: `/chat/${group}/settings`, text: "Settings" }],
        children,
    }));
export default Settings;
