import { input } from "ui/components/input";
import { Button, IconButton } from "ui/components/button";
import { trpc } from "@/utils/trpc";
import { useCopyText } from "ui/hooks/use-copy-text";
import type { GroupInvite } from "db/schema";
import { CheckIcon, CopyIcon, LinkIcon, TrashIcon } from "lucide-react";
import { Serialize } from "shared/types";
import { useSession } from "next-auth/react";
import { Switch } from "ui/components/switch";
import { useGroupContext } from "@/utils/contexts/group-context";

export default function Invite() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();
  const ctx = useGroupContext();
  const isAdmin = ctx.member.admin || ctx.owner_id === session?.user.id;

  const updateMutation = trpc.group.update.useMutation({
    onSuccess: (data, { groupId }) => {
      return utils.group.info.setData({ groupId }, data);
    },
  });

  const onSetPublic = (v: boolean) => {
    updateMutation.mutate({
      groupId: ctx.id,
      public: v,
    });
  };

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex flex-row gap-3 justify-between">
        <label htmlFor="public">
          <h3 className="font-semibold text-sm">Public</h3>
          <p className="text-muted-foreground text-xs">
            Everyone can join this group with an invite url
          </p>
        </label>

        {isAdmin ? (
          <Switch
            id="public"
            checked={ctx.public}
            onCheckedChange={onSetPublic}
            disabled={updateMutation.isLoading}
          />
        ) : null}
      </div>
      {ctx.public ? (
        <PublicInviteItem unique_name={ctx.unique_name} />
      ) : (
        <div className="bg-muted rounded-lg text-muted-foreground text-sm px-4 py-[9px]">
          Public invite is disabled
        </div>
      )}
      {isAdmin ? <PrivateInvites /> : null}
    </div>
  );
}

function PrivateInvites() {
  const group = useGroupContext();
  const utils = trpc.useUtils();

  const createMutation = trpc.group.invite.create.useMutation({
    onSuccess: (data, { groupId }) => {
      return utils.group.invite.get.setData({ groupId }, (prev) =>
        prev != null ? [...prev, data] : prev,
      );
    },
  });
  const invitesQuery = trpc.group.invite.get.useQuery({
    groupId: group.id,
  });

  return (
    <div className="mt-4">
      <h3 className="font-semibold text-sm">Private</h3>
      <p className="text-xs text-muted-foreground">
        Peoples with the invite code can join your group
      </p>
      {invitesQuery.data?.map((invite) => (
        <PrivateInviteItem key={invite.code} invite={invite} />
      ))}
      <div className="flex flex-row gap-3 mt-4">
        <Button
          color="primary"
          isLoading={createMutation.isLoading}
          onClick={() =>
            createMutation.mutate({
              groupId: group.id,
            })
          }
        >
          New Invite
        </Button>
      </div>
    </div>
  );
}

function PublicInviteItem({ unique_name }: { unique_name: string }) {
  const copy = useCopyText();
  const url = getInviteUrl(`@${unique_name}`);

  return (
    <div className="flex flex-row gap-3">
      <input readOnly className={input({ className: "px-4" })} value={url} />
      <Button aria-label="copy" size="small" onClick={() => copy.copy(url)}>
        {copy.isShow ? (
          <CheckIcon className="size-3" />
        ) : (
          <CopyIcon className="size-3" />
        )}
      </Button>
    </div>
  );
}

function PrivateInviteItem({ invite }: { invite: Serialize<GroupInvite> }) {
  const copy = useCopyText();
  const copyLink = useCopyText();

  const utils = trpc.useUtils();
  const deleteMutation = trpc.group.invite.delete.useMutation({
    onSuccess: (_, { groupId, code }) => {
      utils.group.invite.get.setData({ groupId }, (prev) =>
        prev?.filter((invite) => invite.code !== code),
      );
    },
  });

  return (
    <div className="flex flex-row gap-3 mt-3">
      <input
        readOnly
        className={input({ className: "px-4" })}
        value={invite.code}
      />
      <Button
        aria-label="copy"
        size="small"
        onClick={() => copy.copy(invite.code)}
      >
        {copy.isShow ? (
          <CheckIcon className="size-3" />
        ) : (
          <CopyIcon className="size-3" />
        )}
      </Button>
      <Button
        aria-label="copy link"
        size="small"
        onClick={() => copyLink.copy(getInviteUrl(invite.code))}
      >
        {copyLink.isShow ? (
          <CheckIcon className="size-3" />
        ) : (
          <LinkIcon className="size-3" />
        )}
      </Button>
      <IconButton
        aria-label="delete"
        color="danger"
        size="small"
        isLoading={deleteMutation.isLoading}
        onClick={() =>
          deleteMutation.mutate({
            groupId: invite.group_id,
            code: invite.code,
          })
        }
      >
        <TrashIcon className="size-3" />
      </IconButton>
    </div>
  );
}

function getInviteUrl(code: string) {
  return `https://shark-chat.vercel.app/invite/${code}`;
}
