import { Avatar } from "@/components/system/avatar";
import { Button, IconButton } from "@/components/system/button";
import { useGroupLayout } from "@/components/layout/group";
import { AlertDialog } from "@/components/system/alert-dialog";
import { text } from "@/components/system/text";
import { NextPageWithLayout } from "@/pages/_app";
import { groupIcon } from "@/utils/media/format";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";
import { useState } from "react";
import { getQuery } from ".";
import { ImagePicker } from "@/components/input/ImagePicker";
import { Serialize } from "@/utils/types";
import { Group, GroupInvite } from "@prisma/client";
import TextField from "@/components/input/TextField";
import { useUpdateGroupInfoMutation } from "@/utils/trpc/update-group-info";
import { showErrorToast } from "@/stores/page";
import { useCopyTextMutation } from "@/utils/use-copy-text";
import { CopyIcon, TrashIcon } from "@radix-ui/react-icons";
import { useSession } from "next-auth/react";

const Settings: NextPageWithLayout = () => {
    const router = useRouter();
    const { groupId } = getQuery(router);
    const query = trpc.group.info.useQuery({ groupId });
    const [edit, setEdit] = useState(false);

    if (query.data == null) {
        return <></>;
    }

    if (edit)
        return (
            <EditGroupPanel
                group={query.data}
                onCancel={() => setEdit(false)}
            />
        );

    const info = query.data;
    return (
        <div className="flex flex-col gap-6">
            <Avatar
                size="large"
                src={
                    info.icon_hash != null
                        ? groupIcon.url([groupId], info.icon_hash)
                        : null
                }
                fallback={info.name}
            />
            <h2 className="text-2xl font-bold">{info.name}</h2>

            <div className="flex flex-row gap-3">
                <Button color="primary" onClick={() => setEdit(true)}>
                    Edit Info
                </Button>
            </div>
            <Invite group={groupId} />

            <h2 className={text({ size: "xl", type: "primary" })}>
                Danger Zone
            </h2>
            <div>
                <h3 className={text({ size: "lg", type: "primary" })}>
                    Leave Group
                </h3>
                <p
                    className={text({ type: "secondary" })}
                >{`You can still join the group after leaving it`}</p>
                <LeaveGroupButton group={groupId} />
            </div>
            <div>
                <h3 className={text({ size: "lg", type: "primary" })}>
                    Delete Group
                </h3>
                <p
                    className={text({ type: "secondary" })}
                >{`This action is irreversible and can not be undone`}</p>
                <DeleteGroupButton group={groupId} />
            </div>
        </div>
    );
};

function Invite({ group }: { group: number }) {
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
        <>
            <h2 className={text({ size: "xl", type: "primary" })}>
                Invite Members
            </h2>
            <div>
                <h3 className={text({ size: "lg", type: "primary" })}>
                    Pubilc
                </h3>
                <p className={text({ type: "secondary" })}>
                    Anyone can join your server without an invite
                </p>
            </div>
            <div>
                <h3 className={text({ size: "lg", type: "primary" })}>
                    Private
                </h3>
                <p className={text({ type: "secondary" })}>
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
        </>
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

function LeaveGroupButton({ group }: { group: number }) {
    const router = useRouter();
    const mutation = trpc.group.leave.useMutation({
        onSuccess: () => {
            router.push("/home");
        },
        onError: (error) => {
            showErrorToast({
                title: "Failed to leave group",
                description: error.message,
            });
        },
    });

    return (
        <Button
            color="danger"
            isLoading={mutation.isLoading}
            onClick={() => mutation.mutate({ groupId: group })}
            className="mt-4"
        >
            Leave
        </Button>
    );
}

function EditGroupPanel({
    group,
    onCancel,
}: {
    group: Serialize<Group>;
    onCancel: () => void;
}) {
    const [name, setName] = useState(group.name);
    const [icon, setIcon] = useState<string | undefined>(undefined);
    const utils = trpc.useContext();
    const mutation = useUpdateGroupInfoMutation();

    const default_icon =
        group.icon_hash != null
            ? groupIcon.url([group.id], group.icon_hash)
            : null;

    const onSave = () => {
        mutation.mutate(
            { groupId: group.id, icon, name },
            {
                onSuccess(data) {
                    utils.group.info.setData({ groupId: data.id }, () => data);
                    onCancel();
                },
            }
        );
    };
    return (
        <form
            className="flex flex-col gap-3 items-start"
            onSubmit={(e) => {
                onSave();
                e.preventDefault();
            }}
        >
            <ImagePicker
                id="icon"
                value={icon ?? default_icon}
                onChange={setIcon}
                previewClassName="w-[150px] h-[150px] max-w-full"
            />
            <TextField
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <div className="flex flex-row gap-3">
                <Button
                    type="submit"
                    color="primary"
                    isLoading={mutation.isLoading}
                >
                    Save Changes
                </Button>
                <Button disabled={mutation.isLoading} onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}

function DeleteGroupButton({ group }: { group: number }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const deleteMutation = trpc.group.delete.useMutation({
        onSuccess() {
            router.push("/home");
            setOpen(false);
        },
    });

    return (
        <AlertDialog
            open={open}
            onOpenChange={setOpen}
            title="Do you sure?"
            description="This will delete the group, along with all of its messages"
            action={
                <Button
                    color="danger"
                    isLoading={deleteMutation.isLoading}
                    onClick={(e) => {
                        deleteMutation.mutate({ groupId: group });
                        e.preventDefault();
                    }}
                >
                    Delete Group
                </Button>
            }
        >
            <Button color="danger" className="w-fit mt-4">
                Delete
            </Button>
        </AlertDialog>
    );
}

Settings.useLayout = (children) =>
    useGroupLayout((group) => ({
        title: "Settings",
        breadcrumb: [{ href: `/chat/${group}/settings`, text: "Settings" }],
        children,
    }));
export default Settings;
