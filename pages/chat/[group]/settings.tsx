import { Avatar } from "@/components/system/avatar";
import { Button } from "@/components/system/button";
import { useGroupLayout } from "@/components/layout/group";
import { AlertDialog } from "@/components/system/alert-dialog";
import { text } from "@/components/system/text";
import { NextPageWithLayout } from "@/pages/_app";
import { groupIcon } from "@/utils/media";
import { trpc } from "@/utils/trpc";
import clsx from "clsx";
import { useRouter } from "next/router";
import { useState } from "react";
import { getQuery } from ".";
import { ImagePicker } from "@/components/input/ImagePicker";
import { Serialize } from "@/utils/types";
import { Group } from "@prisma/client";
import TextField from "@/components/input/TextField";
import { useUpdateGroupInfoMutation } from "@/utils/trpc/update-group-info";

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
        <div className="flex flex-col gap-3">
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
            <div
                className={clsx(
                    "flex flex-col p-3 border-[1px] border-red-500 rounded-md mt-5",
                    "sm:p-4"
                )}
            >
                <div>
                    <h3 className="text-xl font-semibold">Delete Group</h3>
                    <p
                        className={text({ type: "secondary" })}
                    >{`This action is irreversible and can not be undone`}</p>
                </div>

                <DeleteGroupButton group={groupId} />
            </div>
        </div>
    );
};

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
