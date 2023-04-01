import { AlertDialog } from "@/components/system/alert-dialog";
import { Button } from "@/components/system/button";
import { text } from "@/components/system/text";
import { useMutationHandlers } from "@/utils/handlers/trpc";
import { showErrorToast } from "@/utils/stores/page";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";
import { useState } from "react";

export function Danger({
    group,
    isAdmin,
}: {
    group: number;
    isAdmin: boolean;
}) {
    return (
        <div className="flex flex-col gap-3">
            <h2 className={text({ size: "lg", type: "primary" })}>
                Danger Zone
            </h2>

            <div>
                <h3 className={text({ size: "md", type: "primary" })}>
                    Leave Group
                </h3>
                <p
                    className={text({ size: "sm", type: "secondary" })}
                >{`You can still join the group after leaving it`}</p>
                <LeaveGroupButton group={group} />
            </div>

            {isAdmin && (
                <div className="mt-3">
                    <h3 className={text({ size: "md", type: "primary" })}>
                        Delete Group
                    </h3>
                    <p
                        className={text({ size: "sm", type: "secondary" })}
                    >{`This action is irreversible and can not be undone`}</p>
                    <DeleteGroupButton group={group} />
                </div>
            )}
        </div>
    );
}

function LeaveGroupButton({ group }: { group: number }) {
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
        <Button
            color="danger"
            isLoading={mutation.isLoading}
            onClick={() => mutation.mutate({ groupId: group })}
            className="mt-3"
        >
            Leave
        </Button>
    );
}

function DeleteGroupButton({ group }: { group: number }) {
    const [open, setOpen] = useState(false);
    const handlers = useMutationHandlers();
    const deleteMutation = trpc.group.delete.useMutation({
        onSuccess(_, { groupId }) {
            setOpen(false);
            return handlers.deleteGroup(groupId);
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
