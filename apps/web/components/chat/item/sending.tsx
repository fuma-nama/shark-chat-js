import { useProfile } from "@/utils/hooks/use-profile";
import * as MessageItem from "./atom";
import * as ContextMenu from "ui/components/context-menu";
import { useMemo } from "react";
import { MessagePlaceholder } from "@/utils/stores/chat";
import { UploadingAttachmentItem } from "../AttachmentItem";
import { XIcon } from "lucide-react";

export function LocalMessageItem({
    item,
    onDelete,
}: {
    item: MessagePlaceholder;
    onDelete: () => void;
}) {
    const timestamp = useMemo(() => new Date(Date.now()), []);
    const { profile } = useProfile();

    return (
        <MessageItem.Root>
            <MessageItem.Content
                user={profile}
                timestamp={timestamp}
                className="opacity-50"
            >
                <MessageItem.Text>{item.data.content}</MessageItem.Text>
                {item.data.attachment != null && (
                    <UploadingAttachmentItem file={item.data.attachment} />
                )}
                {item.error != null && (
                    <p className="text-red-400">{item.error}</p>
                )}
            </MessageItem.Content>
            <ContextMenu.Content>
                <ContextMenu.Item
                    icon={<XIcon className="w-4 h-4" />}
                    shortcut="⌘+D"
                    color="danger"
                    onClick={onDelete}
                >
                    Delete
                </ContextMenu.Item>
            </ContextMenu.Content>
        </MessageItem.Root>
    );
}
