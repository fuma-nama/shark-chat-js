import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogProps,
} from "ui/components/dialog";
import { ReactNode, useState } from "react";
import { trpc } from "@/utils/trpc";
import { Avatar } from "ui/components/avatar";
import { Button, button } from "ui/components/button";
import Router from "next/router";
import { Spinner } from "ui/components/spinner";

export function UserProfileModal({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      <DialogContent className="max-w-lg">
        <Content userId={userId} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export default function UserProfileModalDefault({
  userId,
  ...props
}: {
  userId: string;
} & DialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent className="max-w-lg">
        <Content userId={userId} onClose={() => props.onOpenChange?.(false)} />
      </DialogContent>
    </Dialog>
  );
}

function Content({ userId, onClose }: { userId: string; onClose: () => void }) {
  const utils = trpc.useContext();
  const query = trpc.account.profile.useQuery({ userId });
  const dmMutation = trpc.dm.open.useMutation({
    onSuccess: (res) => {
      Router.push(`/dm/${res.id}`);
      onClose();
    },
  });

  const onSendMessage = () => {
    const data = utils.dm.channels.getData();

    if (data != null) {
      const channel = data.find((channel) => channel.user.id === userId);

      if (channel != null) {
        Router.push(`/dm/${channel.id}`);
        onClose();
        return;
      }
    }

    dmMutation.mutate({
      userId,
    });
  };

  if (query.data == null) {
    return (
      <div className="min-h-[350px] flex flex-col items-center justify-center text-center">
        <Spinner size="medium" />
        <p className="text-xs mt-2">Loading</p>
      </div>
    );
  }

  const user = query.data;

  return (
    <div className="flex flex-col">
      <div className="h-24 bg-brand-600 dark:bg-brand-400 rounded-lg -mb-12" />
      <div className="px-6 pb-2">
        <Avatar
          fallback={user.name}
          src={user.image}
          size="large"
          className="-ml-2 border-4 border-background"
        />
        <div className="mt-2">
          <p className="font-semibold text-xl">{user.name}</p>
          <p className="text-sm text-muted-foreground">@{user.id}</p>
        </div>
        <div className="flex flex-row gap-3 mt-8">
          <Button
            color="primary"
            className="flex-1"
            isLoading={dmMutation.isLoading}
            onClick={onSendMessage}
          >
            Send Message
          </Button>
          <DialogClose className={button({ color: "secondary" })}>
            Close
          </DialogClose>
        </div>
      </div>
    </div>
  );
}
