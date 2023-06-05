import { Serialize } from "@/utils/types";
import { useState } from "react";
import * as Item from "./MessageItem";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { DirectMessageType } from "@/server/schema/chat";
import { AttachmentItem } from "./AttachmentItem";
import { useDirectMessage } from "@/utils/stores/chat";

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
    const updateSendbar = useDirectMessage((s) => s.updateSendbar);

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
            onReply={() =>
                updateSendbar(message.receiver_id, { reply_to: message })
            }
            onDelete={onDelete}
        >
            {message.reply_message != null && (
                <div className="flex flex-row gap-2 items-center overflow-hidden max-w-full border-l-2 border-slate-500 p-2 rounded-md">
                    <p className="text-muted-foreground text-sm font-medium">
                        {message.reply_user?.name}
                    </p>
                    <p className="text-muted-foreground text-sm whitespace-nowrap">
                        {message.reply_message.content}
                    </p>
                </div>
            )}
            {message.reply_id != null && message.reply_message == null && (
                <div className="border-l-2 border-slate-500 p-2 rounded-md">
                    <p className="text-muted-foreground text-sm">
                        Message Deleted
                    </p>
                </div>
            )}

            {editing ? (
                <Item.Edit
                    onEdit={onEdit}
                    isLoading={editMutation.isLoading}
                    initialValue={message.content}
                    onCancel={() => setEditing(false)}
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
