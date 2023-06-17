import { ReactNode } from "react";
import * as ContextMenu from "ui/components/context-menu";
import { XIcon } from "lucide-react";
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
                    icon={<XIcon className="w-4 h-4" />}
                    onClick={onClose}
                >
                    Close
                </ContextMenu.Item>
            </ContextMenu.Content>
        </ContextMenu.Root>
    );
}
