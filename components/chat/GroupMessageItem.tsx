import { MessageType } from "@/server/schema/chat";
import { trpc } from "@/utils/trpc";
import { useIsGroupAdmin } from "@/utils/trpc/is-group-admin";
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
    const isAdmin = useIsGroupAdmin({ groupId: message.group_id });

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
            isEditing={editing}
            canEdit={
                status === "authenticated" && message.author_id == data.user.id
            }
            canDelete={!isAdmin.loading && isAdmin.value}
            onCopy={() => navigator.clipboard.writeText(message.content)}
            onEditChange={setEditing}
            onDelete={onDelete}
        >
            <Item.Content user={message.author} timestamp={message.timestamp}>
                {editing ? (
                    <Item.Edit
                        onEdit={onEdit}
                        isLoading={editMutation.isLoading}
                        initialValue={message.content}
                    />
                ) : (
                    <p className="whitespace-pre-wrap break-all">
                        {message.content}
                    </p>
                )}
            </Item.Content>
        </Item.Root>
    );
}
