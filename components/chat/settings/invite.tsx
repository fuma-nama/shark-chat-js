import { input } from "@/components/system/input";
import { Button, IconButton } from "@/components/system/button";
import { text } from "@/components/system/text";
import { trpc } from "@/utils/trpc";
import { useCopyText } from "@/utils/use-copy-text";
import { Group, GroupInvite } from "@/drizzle/schema";
import {
    CheckIcon,
    CopyIcon,
    Link1Icon,
    TrashIcon,
} from "@radix-ui/react-icons";
import { Serialize } from "@trpc/server/dist/shared/internal/serialize";
import { useSession } from "next-auth/react";
import { Switch } from "@/components/system/switch";

export default function Invite({ group }: { group: Group }) {
    const { status } = useSession();
    const utils = trpc.useContext();

    const invitesQuery = trpc.group.invite.get.useQuery(
        {
            groupId: group.id,
        },
        { enabled: status === "authenticated" }
    );
    const updateMutation = trpc.group.update.useMutation({
        onSuccess: (data, { groupId }) => {
            return utils.group.info.setData({ groupId }, data);
        },
    });
    const createMutation = trpc.group.invite.create.useMutation({
        onSuccess: (data, { groupId }) => {
            return utils.group.invite.get.setData({ groupId }, (prev) =>
                prev != null ? [...prev, data] : prev
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
                    <h3 className={text({ size: "md", type: "primary" })}>
                        Pubilc
                    </h3>
                    <p className={text({ size: "sm", type: "secondary" })}>
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
            {group.public && (
                <PublicInviteItem unique_name={group.unique_name} />
            )}
            <div className="mt-3">
                <h3 className={text({ size: "md", type: "primary" })}>
                    Private
                </h3>
                <p className={text({ size: "sm", type: "secondary" })}>
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
            <input
                readOnly
                className={input({ className: "px-4" })}
                value={url}
            />
            <Button aria-label="copy" onClick={() => copy.copy(url)}>
                {copy.isShow ? <CheckIcon /> : <CopyIcon />}
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
                prev?.filter((invite) => invite.code !== code)
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
            <Button aria-label="copy" onClick={() => copy.copy(invite.code)}>
                {copy.isShow ? <CheckIcon /> : <CopyIcon />}
            </Button>
            <Button
                aria-label="copy link"
                onClick={() => copyLink.copy(getInviteUrl(invite.code))}
            >
                {copyLink.isShow ? <CheckIcon /> : <Link1Icon />}
            </Button>
            <IconButton
                aria-label="delete"
                color="danger"
                isLoading={deleteMutation.isLoading}
                className="w-14"
                onClick={() =>
                    deleteMutation.mutate({
                        groupId: invite.group_id,
                        code: invite.code,
                    })
                }
            >
                <TrashIcon />
            </IconButton>
        </div>
    );
}

function getInviteUrl(code: string) {
    return `https://shark-chat.vercel.app/invite/${code}`;
}
