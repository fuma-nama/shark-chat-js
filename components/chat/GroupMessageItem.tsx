import { MessageType } from "@/server/schema/group";
import { trpc } from "@/utils/trpc";
import { Serialize } from "@/utils/types";
import { useSession } from "next-auth/react";
import { useState } from "react";

import * as Item from "./MessageItem";

export function GroupMessageItem({
    message,
}: {
    message: Serialize<MessageType>;
}) {
    const { status, data } = useSession();
    const [editing, setEditing] = useState(false);
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

    return (
        <Item.Root
            isEditing={editing}
            isAuthor={
                status === "authenticated" && message.author_id == data.user.id
            }
            isLoading={editMutation.isLoading || deleteMutation.isLoading}
            onCopy={() => navigator.clipboard.writeText(message.content)}
            onEditChange={setEditing}
            onDelete={() =>
                deleteMutation.mutate({
                    messageId: message.id,
                    groupId: message.group_id,
                })
            }
        >
            <Item.Content user={message.author} timestamp={message.timestamp}>
                {editing ? (
                    <Item.Edit
                        onEdit={onEdit}
                        isLoading={editMutation.isLoading}
                        initialValue={message.content}
                    />
                ) : (
                    <p className="whitespace-pre">{message.content}</p>
                )}
            </Item.Content>
        </Item.Root>
    );
}
