import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogProps,
} from "ui/components/dialog";
import { ReactNode } from "react";
import { trpc } from "@/utils/trpc";
import { Avatar } from "ui/components/avatar";
import { Button, button } from "ui/components/button";
import { Spinner } from "ui/components/spinner";
import { useRouter } from "next/navigation";
import { cn } from "ui/utils/cn";
import { BannerImage } from "@/components/BannerImage";
import { userBanners } from "shared/media/format";

export function UserProfileModal(props: {
  userId: string;
  children: ReactNode;
}) {
  return <UserProfileModalDefault {...props} />;
}

export default function UserProfileModalDefault({
  userId,
  ...props
}: {
  userId: string;
} & DialogProps) {
  return (
    <Dialog {...props}>
      {props.children}
      <DialogContent className="p-0">
        <Content userId={userId} onClose={() => props.onOpenChange?.(false)} />
      </DialogContent>
    </Dialog>
  );
}

function Content({ userId, onClose }: { userId: string; onClose: () => void }) {
  const utils = trpc.useUtils();
  const query = trpc.account.profile.useQuery({ userId });
  const router = useRouter();
  const status = trpc.chat.status.useQuery({ userId });
  const dmMutation = trpc.dm.open.useMutation({
    onSuccess: (res) => {
      void router.push(`/dm/${res.id}`);
      onClose();
    },
  });

  const onSendMessage = () => {
    const data = utils.dm.channels.getData();

    if (data != null) {
      const channel = data.find((channel) => channel.user.id === userId);

      if (channel != null) {
        router.push(`/dm/${channel.id}`);
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
    <div className="flex flex-col px-6 pb-6">
      <BannerImage
        className="rounded-t-lg aspect-[4] -mx-6"
        url={userBanners.url([user.id], user.banner_hash)}
      />
      <div className="-ml-2 relative size-fit">
        <Avatar
          fallback={user.name}
          src={user.image}
          size="large"
          className="border-4 border-background -mt-12"
        />
        {status.isSuccess ? (
          <div
            aria-label={status.data}
            className={cn(
              "absolute border-4 border-background bottom-2 right-0 size-6 rounded-full",
              status.data === "online" ? "bg-green-400" : "bg-red-400",
            )}
          />
        ) : null}
      </div>

      <p className="font-semibold mt-2">{user.name}</p>
      <p className="text-xs text-muted-foreground mt-1">@{user.id}</p>

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
  );
}
