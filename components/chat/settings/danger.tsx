import { AlertDialog } from "@/components/system/alert-dialog";
import { Button } from "@/components/system/button";
import { text } from "@/components/system/text";
import { showErrorToast } from "@/utils/stores/page";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Danger({ group }: { group: number }) {
    return (
        <div className="flex flex-col gap-3">
            <LeaveGroup group={group} />
            <div className="mt-3">
                <h3 className={text({ size: "md", type: "primary" })}>
                    Delete Group
                </h3>
                <p
                    className={text({ size: "sm", type: "secondary" })}
                >{`This action is irreversible and can not be undone`}</p>
                <DeleteGroupButton group={group} />
            </div>
        </div>
    );
}

export function LeaveGroup({ group }: { group: number }) {
    const router = useRouter();
    const mutation = trpc.group.leave.useMutation({
        onSuccess: () => {
            return router.push("/home");
        },
        onError: (error) => {
            showErrorToast({
                title: "Failed to leave group",
                description: error.message,
            });
        },
    });

    return (
        <div>
            <h3 className={text({ size: "md", type: "primary" })}>
                Leave Group
            </h3>
            <p
                className={text({ size: "sm", type: "secondary" })}
            >{`You can still join the group after leaving it`}</p>
            <Button
                color="danger"
                isLoading={mutation.isLoading}
                onClick={() => mutation.mutate({ groupId: group })}
                className="mt-3"
            >
                Leave
            </Button>
        </div>
    );
}

function DeleteGroupButton({ group }: { group: number }) {
    const [open, setOpen] = useState(false);
    const deleteMutation = trpc.group.delete.useMutation({
        onSuccess() {
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
            <Button color="danger" className="w-fit mt-3">
                Delete
            </Button>
        </AlertDialog>
    );
}
