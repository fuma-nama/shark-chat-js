"use client";
import Info from "./info";
import { Spinner } from "ui/components/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/components/tabs";
import { Danger, LeaveGroup } from "./danger";
import Members from "./members";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import Invite from "./invite";

export default function Page({ params }: { params: { group: string } }) {
  const groupId = Number(params.group);
  const { status, data } = useSession();
  const query = trpc.group.info.useQuery(
    { groupId },
    { enabled: status === "authenticated" },
  );
  const isAdmin =
    query.status === "success" && query.data.owner_id === data!!.user.id;

  return (
    <div className="flex flex-col gap-10 mx-auto w-full max-w-3xl p-4">
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
              <TabsContent value="invite" className="pt-4">
                <Invite group={query.data} />
              </TabsContent>
              <TabsContent value="member" className="pt-4">
                <Members group={groupId} isAdmin />
              </TabsContent>
              <TabsContent value="danger" className="pt-4">
                <Danger group={groupId} />
              </TabsContent>
            </Tabs>
          )}
          {!isAdmin && (
            <>
              <Members group={groupId} isAdmin={false} />
              <LeaveGroup group={groupId} />
            </>
          )}
        </>
      )}
    </div>
  );
}
