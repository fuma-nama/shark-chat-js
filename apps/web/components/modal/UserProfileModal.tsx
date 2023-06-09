import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogTrigger,
} from "ui/components/dialog";
import { ReactNode, useState } from "react";
import { RouterOutput, trpc } from "@/utils/trpc";
import { Avatar } from "ui/components/avatar";
import { Button, button } from "ui/components/button";
import Router from "next/router";

type Profile = RouterOutput["account"]["profile"];

export function UserProfileModal({
    userId,
    children,
}: {
    userId: string;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const query = trpc.account.profile.useQuery({ userId });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-lg">
                {query.status === "success" && (
                    <Content user={query.data} onClose={() => setOpen(false)} />
                )}
            </DialogContent>
        </Dialog>
    );
}

function Content({ user, onClose }: { user: Profile; onClose: () => void }) {
    const utils = trpc.useContext();
    const dmMutation = trpc.dm.open.useMutation({
        onSuccess: (res) => {
            Router.push(`/dm/${res.id}`);
            onClose();
        },
    });

    const onSendMessage = () => {
        const data = utils.dm.channels.getData();

        if (data != null) {
            const channel = data.find((channel) => channel.user.id === user.id);

            if (channel != null) {
                Router.push(`/dm/${channel.id}`);
                onClose();
                return;
            }
        }

        dmMutation.mutate({
            userId: user.id,
        });
    };

    return (
        <div className="flex flex-col">
            <div className="h-24 bg-brand-600 dark:bg-brand-400 rounded-lg -mb-12" />
            <div className="px-6 pb-2">
                <Avatar
                    fallback={user.name}
                    src={user.image}
                    size="large"
                    border="wide"
                    className="-ml-2"
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
