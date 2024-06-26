import { Info } from "./info";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/components/tabs";
import { Danger } from "./danger";
import Members from "./members";
import Invite from "./invite";

export default function Page({ params }: { params: { group: string } }) {
  const groupId = params.group;

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl p-4 pt-0">
      <Info />
      <Tabs defaultValue="invite">
        <TabsList>
          <TabsTrigger value="invite">Invite</TabsTrigger>
          <TabsTrigger value="member">Member</TabsTrigger>
          <TabsTrigger value="danger">Danger</TabsTrigger>
        </TabsList>
        <TabsContent value="invite" className="pt-4">
          <Invite />
        </TabsContent>
        <TabsContent value="member" className="pt-4">
          <Members group={groupId} />
        </TabsContent>
        <TabsContent value="danger" className="pt-4">
          <Danger group={groupId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
