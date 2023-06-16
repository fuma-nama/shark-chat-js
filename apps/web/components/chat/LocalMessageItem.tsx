import { useProfile } from "@/utils/hooks/use-profile";
import * as MessageItem from "./MessageItem";
import { useMemo } from "react";
import { MessagePlaceholder } from "@/utils/stores/chat";
import { UploadingAttachmentItem } from "./AttachmentItem";

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
        <MessageItem.Root
            canDelete
            canEdit={false}
            onReply={() => {}}
            isEditing={false}
            onEditChange={() => {}}
            onCopy={() => {}}
            onDelete={onDelete}
        >
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
        </MessageItem.Root>
    );
}
