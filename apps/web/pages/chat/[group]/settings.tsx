import { BreadcrumbItem } from "@/components/layout/group-breadcrumb";
import { NextPageWithLayout } from "@/pages/_app";
import { useRouter } from "next/router";
import Info from "@/components/chat/settings/info";
import { Spinner } from "ui/components/spinner";
import { getGroupQuery } from "@/utils/variables";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/components/tabs";
import dynamic from "next/dynamic";
import { LeaveGroup } from "@/components/chat/settings/danger";
import Members from "@/components/chat/settings/members";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { AppLayout, Content } from "@/components/layout/app";

const Invite = dynamic(() => import("@/components/chat/settings/invite"));
const Danger = dynamic(() => import("@/components/chat/settings/danger"));

const Settings: NextPageWithLayout = () => {
  const { groupId } = getGroupQuery(useRouter());
  const { status, data } = useSession();
  const query = trpc.group.info.useQuery(
    { groupId },
    { enabled: status === "authenticated" },
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
            <Tabs defaultValue="invite">
              <TabsList className="mb-4">
                <TabsTrigger value="invite">Invite</TabsTrigger>
                <TabsTrigger value="member">Member</TabsTrigger>
                <TabsTrigger value="danger">Danger</TabsTrigger>
              </TabsList>
              <TabsContent value="invite">
                <Invite group={query.data} />
              </TabsContent>
              <TabsContent value="member">
                <Members group={groupId} isAdmin />
              </TabsContent>
              <TabsContent value="danger">
                <Danger group={groupId} />
              </TabsContent>
            </Tabs>
          )}
          {!isAdmin && (
            <>
              <div>
                <h2 className="font-medium text-base mb-3 text-foreground">
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

Settings.useLayout = (children) => (
  <AppLayout>
    <Navbar
      breadcrumb={[
        {
          text: <BreadcrumbItem />,
          href: `/chat/[group]`,
        },
        { href: `/chat/[group]/settings`, text: "Settings" },
      ]}
    />

    <Content>{children}</Content>
  </AppLayout>
);

export default Settings;
