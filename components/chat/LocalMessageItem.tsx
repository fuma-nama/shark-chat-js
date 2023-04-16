import useProfile from "@/utils/use-profile";
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
        <div className="opacity-50">
            <MessageItem.Root
                user={profile!!}
                timestamp={timestamp}
                canDelete
                canEdit={false}
                isEditing={false}
                onEditChange={() => {}}
                onCopy={() => {}}
                onDelete={onDelete}
            >
                <MessageItem.Text>{item.data.content}</MessageItem.Text>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
                    {item.data.attachments.map((file, i) => (
                        <UploadingAttachmentItem key={i} file={file} />
                    ))}
                </div>
                {item.error != null && (
                    <p className="text-red-400">{item.error}</p>
                )}
            </MessageItem.Root>
        </div>
    );
}
