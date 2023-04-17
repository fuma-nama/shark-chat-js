import { MessageType } from "@/server/schema/chat";
import { trpc } from "@/utils/trpc";
import { Serialize } from "@/utils/types";
import { useSession } from "next-auth/react";
import { useState } from "react";

import * as Item from "./MessageItem";
import { AttachmentItem } from "./AttachmentItem";

export function GroupMessageItem({
    message,
}: {
    message: Serialize<MessageType>;
}) {
    const { status, data } = useSession();
    const [editing, setEditing] = useState(false);
    const query = trpc.group.info.useQuery(
        { groupId: message.group_id },
        { enabled: status === "authenticated", staleTime: Infinity }
    );

    const isAuthor =
        status === "authenticated" && message.author_id === data.user.id;
    const isAdmin =
        query.status === "success" &&
        status === "authenticated" &&
        query.data.owner_id === data.user.id;

    const deleteMutation = trpc.chat.delete.useMutation();
    const editMutation = trpc.chat.update.useMutation({
        onSuccess: () => {
            setEditing(false);
        },
    });

    const onEdit = (v: Item.EditPayload) => {
        editMutation.mutate({
            content: v.content,
            messageId: message.id,
            groupId: message.group_id,
        });
    };

    const onDelete = () => {
        deleteMutation.mutate({
            messageId: message.id,
        });
    };

    return (
        <Item.Root
            user={message.author}
            timestamp={message.timestamp}
            isEditing={editing}
            canEdit={isAuthor}
            canDelete={isAdmin || isAuthor}
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
