import { Avatar } from "ui/components/avatar";
import { Button } from "ui/components/button";
import { trpc } from "@/utils/trpc";
import { Serialize } from "shared/types";
import { useSession } from "next-auth/react";
import { UserProfileModal } from "@/components/modal/UserProfileModal";
import { DialogTrigger } from "ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/components/select";
import { useState } from "react";
import { MemberWithUser } from "server/routers/group/members";
import { useGroupContext } from "@/utils/contexts/group-context";

export default function Members({ group }: { group: string }) {
  return (
    <div className="p-1">
      <h3 className="font-semibold text-sm mb-4">Members</h3>
      <MembersList group={group} />
    </div>
  );
}

export function MembersList({ group }: { group: string }) {
  const { status } = useSession();
  const query = trpc.group.member.get.useQuery(
    { groupId: group },
    { enabled: status === "authenticated" },
  );

  return (
    <div className="flex flex-col gap-1">
      {query.isLoading ? (
        <Skeleton />
      ) : (
        query.data?.map((member) => (
          <MemberItem key={member.user_id} member={member} />
        ))
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <>
      <div className="h-[44px] rounded-md bg-muted/50" />
      <div className="h-[44px] rounded-md bg-muted/50" />
      <div className="h-[44px] rounded-md bg-muted/50" />
    </>
  );
}

function MemberItem({ member }: { member: Serialize<MemberWithUser> }) {
  const utils = trpc.useUtils();
  const ctx = useGroupContext();
  const { data: session } = useSession();
  const [value, setValue] = useState(member.admin ? "admin" : "member");
  const update = trpc.group.member.update.useMutation();
  const kick = trpc.group.member.kick.useMutation({
    onSuccess(_, { groupId, userId }) {
      utils.group.member.get.setData({ groupId }, (prev) =>
        prev?.filter((member) => member.user_id !== userId),
      );
    },
  });

  const isOwner = session && ctx.owner_id === session.user.id;
  const canUpdate = isOwner && member.user_id !== session?.user.id;

  const canKick =
    // Owner
    (isOwner && member.user_id !== session?.user.id) ||
    // Admin
    (ctx.member.admin && !member.admin && member.user_id !== ctx.owner_id);

  const onValueChange = (value: string) => {
    setValue(value);
    update.mutate({
      groupId: ctx.id,
      userId: member.user_id,
      admin: value === "admin",
    });
  };

  return (
    <UserProfileModal userId={member.user_id}>
      <div className="flex flex-row items-center gap-2 p-2 rounded-md bg-card flex-wrap hover:bg-accent">
        <DialogTrigger asChild>
          <Avatar
            alt="avatar"
            size="small"
            src={member.user.image}
            fallback={member.user.name}
          />
        </DialogTrigger>
        <DialogTrigger asChild>
          <p className="text-sm font-medium cursor-pointer mr-auto">
            {member.user.name}
          </p>
        </DialogTrigger>
        {canUpdate ? (
          <Select
            value={value}
            onValueChange={onValueChange}
            disabled={update.isLoading}
          >
            <SelectTrigger className="max-w-[100px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <p className="text-xs px-2 text-muted-foreground">
            {ctx.owner_id === member.user.id
              ? "Owner"
              : member.admin
                ? "Admin"
                : "Member"}
          </p>
        )}
        {canKick ? (
          <Button
            color="danger"
            isLoading={kick.isLoading}
            onClick={() => {
              kick.mutate({
                groupId: member.group_id,
                userId: member.user_id,
              });
            }}
          >
            Kick
          </Button>
        ) : null}
      </div>
    </UserProfileModal>
  );
}
