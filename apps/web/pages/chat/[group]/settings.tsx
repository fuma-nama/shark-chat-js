import { BreadcrumbItem } from "@/components/layout/GroupBreadcrumb";
import { NextPageWithLayout } from "@/pages/_app";
import { useRouter } from "next/router";
import Info from "@/components/chat/settings/info";
import { Spinner } from "ui/components/spinner";
import { getGroupQuery } from "@/utils/variables";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/components/tabs";
import Danger, { LeaveGroup } from "@/components/chat/settings/danger";
import Members from "@/components/chat/settings/members";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { AppLayout, Content } from "@/components/layout/app";
import Invite from "@/components/chat/settings/invite";

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
    <div className="flex flex-col gap-10 mx-auto w-full max-w-3xl">
      {query.isLoading || query.isError ? (
        <div className="m-auto">
          <Spinner size="large" />
        </div>
      ) : (
        <>
          <Info group={query.data} isAdmin={isAdmin} />
          {isAdmin && (
            <Tabs defaultValue="invite">
              <TabsList>
                <TabsTrigger value="invite">Invite</TabsTrigger>
                <TabsTrigger value="member">Member</TabsTrigger>
                <TabsTrigger value="danger">Danger</TabsTrigger>
              </TabsList>
              <TabsContent
                value="invite"
                className="border border-border rounded-xl p-3"
              >
                <Invite group={query.data} />
              </TabsContent>
              <TabsContent
                value="member"
                className="border border-border rounded-xl p-3"
              >
                <Members group={groupId} isAdmin />
              </TabsContent>
              <TabsContent
                value="danger"
                className="border border-border rounded-xl p-3"
              >
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
