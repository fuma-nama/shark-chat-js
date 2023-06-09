import { useGroupLayout } from "@/components/layout/group";
import { NextPageWithLayout } from "@/pages/_app";
import { useRouter } from "next/router";
import Info from "@/components/chat/settings/info";
import { Spinner } from "@/components/system/spinner";
import { getGroupQuery } from "@/utils/variables";
import { Tabs, TabsContent } from "@/components/system/tabs";
import dynamic from "next/dynamic";
import { LeaveGroup } from "@/components/chat/settings/danger";
import Members from "@/components/chat/settings/members";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";

const Invite = dynamic(() => import("@/components/chat/settings/invite"));
const Danger = dynamic(() => import("@/components/chat/settings/danger"));

const Settings: NextPageWithLayout = () => {
    const { groupId } = getGroupQuery(useRouter());
    const { status, data } = useSession();
    const query = trpc.group.info.useQuery(
        { groupId },
        { enabled: status === "authenticated" }
    );
    const isAdmin =
        query.status === "success" && query.data.owner_id === data!!.user.id;

    return (
        <div className="flex flex-col gap-10 max-w-3xl min-h-full">
            {query.isLoading || query.isError ? (
                <div className="m-auto">
                    <Spinner size="large" />
                </div>
            ) : (
                <>
                    <Info group={query.data} isAdmin={isAdmin} />
                    {isAdmin && (
                        <Tabs
                            defaultValue="invite"
                            items={[
                                { text: "Invite", value: "invite" },
                                { text: "Member", value: "member" },
                                { text: "Danger", value: "danger" },
                            ]}
                        >
                            <TabsContent value="invite" className="mt-5">
                                <Invite group={query.data} />
                            </TabsContent>
                            <TabsContent value="member" className="mt-5">
                                <Members group={groupId} isAdmin />
                            </TabsContent>
                            <TabsContent value="danger" className="mt-5">
                                <Danger group={groupId} />
                            </TabsContent>
                        </Tabs>
                    )}
                    {!isAdmin && (
                        <>
                            <div>
                                <h2 className="font-medium text-base mb-3 text-primary-foreground">
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
    useGroupLayout({
        breadcrumb: [{ href: `/chat/[group]/settings`, text: "Settings" }],
        children,
    });
export default Settings;
