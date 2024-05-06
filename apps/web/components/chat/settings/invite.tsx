import { input } from "ui/components/input";
import { Button, IconButton } from "ui/components/button";
import { trpc } from "@/utils/trpc";
import { useCopyText } from "ui/hooks/use-copy-text";
import { Group, GroupInvite } from "db/schema";
import { CheckIcon, CopyIcon, LinkIcon, TrashIcon } from "lucide-react";
import { Serialize } from "shared/types";
import { useSession } from "next-auth/react";
import { Switch } from "ui/components/switch";

export default function Invite({ group }: { group: Group }) {
  const { status } = useSession();
  const utils = trpc.useUtils();

  const invitesQuery = trpc.group.invite.get.useQuery(
    {
      groupId: group.id,
    },
    { enabled: status === "authenticated" },
  );
  const updateMutation = trpc.group.update.useMutation({
    onSuccess: (data, { groupId }) => {
      return utils.group.info.setData({ groupId }, data);
    },
  });
  const createMutation = trpc.group.invite.create.useMutation({
    onSuccess: (data, { groupId }) => {
      return utils.group.invite.get.setData({ groupId }, (prev) =>
        prev != null ? [...prev, data] : prev,
      );
    },
  });

  const onSetPublic = (v: boolean) => {
    updateMutation.mutate({
      groupId: group.id,
      public: v,
    });
  };

  const invites = invitesQuery.data;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row gap-3 justify-between">
        <label htmlFor="public">
          <h3 className="font-medium text-foreground">Pubilc</h3>
          <p className="text-sm text-muted-foreground">
            Anyone can join your group with an invite url
          </p>
        </label>
        <Switch
          id="public"
          checked={group.public}
          onCheckedChange={onSetPublic}
          disabled={updateMutation.isLoading}
        />
      </div>
      {group.public && <PublicInviteItem unique_name={group.unique_name} />}
      <div className="mt-4">
        <h3 className="font-medium text-foreground">Private</h3>
        <p className="text-sm text-muted-foreground">
          Peoples with the invite code can join your group
        </p>
        {invites?.map((invite) => (
          <PrivateInviteItem key={invite.code} invite={invite} />
        ))}
        <div className="flex flex-row gap-3 mt-3">
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
          <CheckIcon className="w-3" />
        ) : (
          <CopyIcon className="w-3" />
        )}
      </Button>
    </div>
  );
}

function PrivateInviteItem({ invite }: { invite: Serialize<GroupInvite> }) {
  const copy = useCopyText();
  const copyLink = useCopyText();

  const utils = trpc.useContext();
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
          <CheckIcon className="w-3" />
        ) : (
          <CopyIcon className="w-3" />
        )}
      </Button>
      <Button
        aria-label="copy link"
        size="small"
        onClick={() => copyLink.copy(getInviteUrl(invite.code))}
      >
        {copyLink.isShow ? (
          <CheckIcon className="w-3" />
        ) : (
          <LinkIcon className="w-3" />
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
        <TrashIcon className="w-3" />
      </IconButton>
    </div>
  );
}

function getInviteUrl(code: string) {
  return `https://shark-chat.vercel.app/invite/${code}`;
}
