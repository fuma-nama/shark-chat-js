import { ReactNode } from "react";
import * as ContextMenu from "../system/context-menu";
import { Cross1Icon } from "@radix-ui/react-icons";
import { trpc } from "@/utils/trpc";

export function DirectMessageContextMenu({
    children,
    channelId,
}: {
    children: ReactNode;
    channelId: string;
}) {
    const deleteMutation = trpc.dm.close.useMutation();

    const onClose = () => {
        deleteMutation.mutate({
            channelId,
        });
    };

    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
            <ContextMenu.Content>
                <ContextMenu.Item
                    color="danger"
                    icon={<Cross1Icon className="w-4 h-4" />}
                    onClick={onClose}
                >
                    Close
                </ContextMenu.Item>
            </ContextMenu.Content>
        </ContextMenu.Root>
    );
}
