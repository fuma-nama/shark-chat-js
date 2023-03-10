import Button from "@/components/Button";
import { useGroupLayout } from "@/components/layout/group";
import { AlertDialog } from "@/components/system/alert-dialog";
import { text } from "@/components/system/text";
import { NextPageWithLayout } from "@/pages/_app";
import { groupIcon } from "@/utils/media";
import { trpc } from "@/utils/trpc";
import clsx from "clsx";
import { CldImage } from "next-cloudinary";
import { useRouter } from "next/router";
import { useState } from "react";
import { getQuery } from ".";

const Settings: NextPageWithLayout = () => {
    const router = useRouter();
    const { groupId } = getQuery(router);
    const query = trpc.group.info.useQuery({ groupId });

    if (query.data == null) {
        return <></>;
    }

    const info = query.data;
    return (
        <div className="flex flex-col gap-3">
            {info.icon_hash != null && (
                <CldImage
                    src={groupIcon.url([groupId], info.icon_hash)}
                    width={100}
                    height={100}
                    alt={info.name}
                    className="rounded-full"
                />
            )}
            <h2 className="text-2xl font-bold">{info.name}</h2>

            <div className="flex flex-row gap-3">
                <Button color="primary">Edit Info</Button>
            </div>
            <div
                className={clsx(
                    "flex flex-col p-3 border-2 border-dark-600 rounded-md mt-5",
                    "sm:p-4"
                )}
            ></div>
            <div
                className={clsx(
                    "flex flex-col p-3 border-2 border-red-500 rounded-md mt-5",
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
