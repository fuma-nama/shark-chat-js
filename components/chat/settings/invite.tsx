import { input } from "@/components/system/input";
import { Button, IconButton } from "@/components/system/button";
import { text } from "@/components/system/text";
import { trpc } from "@/utils/trpc";
import { useCopyText } from "@/utils/use-copy-text";
import { GroupInvite } from "@prisma/client";
import { CheckIcon, CopyIcon, TrashIcon } from "@radix-ui/react-icons";
import { Serialize } from "@trpc/server/dist/shared/internal/serialize";
import { useSession } from "next-auth/react";
import { Switch } from "@/components/system/switch";
import { Spinner } from "@/components/system/spinner";

export default function Invite({ group }: { group: number }) {
    const { status } = useSession();
    const utils = trpc.useContext();

    const groupQuery = trpc.group.info.useQuery({ groupId: group });
    const invitesQuery = trpc.group.invite.get.useQuery(
        {
            groupId: group,
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
            groupId: group,
            public: v,
        });
    };

    const invites = invitesQuery.data;
    const groupData = groupQuery.data;
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-row gap-3 justify-between">
                <label htmlFor="public">
                    <h3 className={text({ size: "md", type: "primary" })}>
                        Pubilc
                    </h3>
                    <p className={text({ size: "sm", type: "secondary" })}>
                        Anyone can join your server without an invite
                    </p>
                </label>
                {groupData == null ? (
                    <Spinner size="small" />
                ) : (
                    <Switch
                        id="public"
                        checked={groupData.public}
                        onCheckedChange={onSetPublic}
                        disabled={updateMutation.isLoading}
                    />
                )}
            </div>
            <div className="mt-3">
                <h3 className={text({ size: "md", type: "primary" })}>
                    Private
                </h3>
                <p className={text({ size: "sm", type: "secondary" })}>
                    Only peoples with the invite can join The group
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
                                groupId: group,
                                once: false,
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

function PrivateInviteItem({ invite }: { invite: Serialize<GroupInvite> }) {
    const copy = useCopyText();
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
            <Button
                aria-label="copy"
                isLoading={copy.isLoading}
                onClick={() => copy.copy(invite.code)}
            >
                {copy.isShow ? <CheckIcon /> : <CopyIcon />}
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
