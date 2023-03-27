import { Serialize } from "@/utils/types";
import { useState } from "react";
import * as Item from "./MessageItem";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { DirectMessageType } from "@/server/schema/group";

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

    const onEdit = (v: Item.EditPayload) => {
        editMutation.mutate({
            content: v.content,
            messageId: message.id,
            userId: message.receiver_id,
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
                    userId: message.receiver_id,
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
