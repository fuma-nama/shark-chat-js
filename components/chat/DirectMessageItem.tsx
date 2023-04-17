import { Serialize } from "@/utils/types";
import { useState } from "react";
import * as Item from "./MessageItem";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { DirectMessageType } from "@/server/schema/chat";
import { AttachmentItem } from "./AttachmentItem";

export function DirectMessageItem({
    message,
}: {
    message: Serialize<DirectMessageType>;
}) {
    const { status, data } = useSession();
    const [editing, setEditing] = useState(false);
    const deleteMutation = trpc.dm.delete.useMutation();
    const editMutation = trpc.dm.update.useMutation({
        onSuccess: () => {
            setEditing(false);
        },
    });

    const isAuthor =
        status === "authenticated" && message.author_id == data.user.id;

    const onEdit = (v: Item.EditPayload) => {
        editMutation.mutate({
            content: v.content,
            messageId: message.id,
            userId: message.receiver_id,
        });
    };

    const onDelete = () => {
        deleteMutation.mutate({
            messageId: message.id,
            userId: message.receiver_id,
        });
    };

    return (
        <Item.Root
            user={message.author}
            timestamp={message.timestamp}
            isEditing={editing}
            canEdit={isAuthor}
            canDelete={isAuthor}
            onCopy={() => navigator.clipboard.writeText(message.content)}
            onEditChange={setEditing}
            onDelete={onDelete}
        >
            {editing ? (
                <Item.Edit
                    onEdit={onEdit}
                    isLoading={editMutation.isLoading}
                    initialValue={message.content}
                />
            ) : (
                <Item.Text>{message.content}</Item.Text>
            )}
            {message.attachment != null && (
                <AttachmentItem attachment={message.attachment} />
            )}
        </Item.Root>
    );
}
