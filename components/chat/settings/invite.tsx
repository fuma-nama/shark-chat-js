import TextField from "@/components/input/TextField";
import { Button, IconButton } from "@/components/system/button";
import { text } from "@/components/system/text";
import { trpc } from "@/utils/trpc";
import { useCopyTextMutation } from "@/utils/use-copy-text";
import { GroupInvite } from "@prisma/client";
import { CopyIcon, TrashIcon } from "@radix-ui/react-icons";
import { Serialize } from "@trpc/server/dist/shared/internal/serialize";
import { useSession } from "next-auth/react";

export function Invite({ group }: { group: number }) {
    const { status } = useSession();
    const utils = trpc.useContext();

    const query = trpc.group.invite.get.useQuery(
        {
            groupId: group,
        },
        { enabled: status === "authenticated" }
    );
    const createMutation = trpc.group.invite.create.useMutation({
        onSuccess: (data) => {
            utils.group.invite.get.setData({ groupId: group }, (prev) =>
                prev != null ? [...prev, data] : prev
            );
        },
    });

    const invites = query.data;
    return (
        <div className="flex flex-col gap-6">
            <h2 className={text({ size: "lg", type: "primary" })}>
                Invite Members
            </h2>
            <div>
                <h3 className={text({ size: "md", type: "primary" })}>
                    Pubilc
                </h3>
                <p className={text({ size: "sm", type: "secondary" })}>
                    Anyone can join your server without an invite
                </p>
            </div>
            <div>
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
    const copy = useCopyTextMutation();
    const utils = trpc.useContext();
    const deleteMutation = trpc.group.invite.delete.useMutation({
        onSuccess: (_, { groupId, code }) => {
            utils.group.invite.get.setData({ groupId }, (prev) =>
                prev?.filter((invite) => invite.code !== code)
            );
        },
    });

    return (
        <div className="flex flex-row gap-3 mt-3 max-w-xl">
            <TextField readOnly value={invite.code} />
            <Button
                aria-label="copy"
                isLoading={copy.isLoading}
                onClick={() => copy.mutate(invite.code)}
            >
                <CopyIcon />
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
