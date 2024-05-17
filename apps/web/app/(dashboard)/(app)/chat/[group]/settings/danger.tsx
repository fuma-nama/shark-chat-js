import { AlertDialog } from "ui/components/alert-dialog";
import { Button } from "ui/components/button";
import { showErrorToast } from "@/utils/stores/page";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGroupContext } from "@/utils/contexts/group-context";
import { useSession } from "next-auth/react";

export function Danger({ group }: { group: string }) {
  const { data: session } = useSession();
  const ctx = useGroupContext();

  return (
    <div className="flex flex-col gap-4 p-1">
      <LeaveGroup group={group} />
      {ctx.owner_id === session?.user.id ? <DeleteGroup group={group} /> : null}
    </div>
  );
}

export function LeaveGroup({ group }: { group: string }) {
  const router = useRouter();
  const mutation = trpc.group.leave.useMutation({
    onSuccess: () => {
      return router.push("/");
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
      <h3 className="text-sm font-semibold">Leave Group</h3>
      <p className="text-xs text-muted-foreground">
        You can join the group after leaving it
      </p>
      <Button
        color="danger"
        isLoading={mutation.isLoading}
        onClick={() => mutation.mutate({ groupId: group })}
        className="mt-4"
      >
        Leave
      </Button>
    </div>
  );
}

function DeleteGroup({ group }: { group: string }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold">Delete Group</h3>
      <p className="text-xs text-muted-foreground">
        This action is irreversible and cannot be undone
      </p>
      <DeleteGroupButton group={group} />
    </div>
  );
}

function DeleteGroupButton({ group }: { group: string }) {
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
