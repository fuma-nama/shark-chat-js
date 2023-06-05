import { MessageType } from "@/server/schema/chat";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useState } from "react";

import * as Item from "./MessageItem";
import { AttachmentItem } from "./AttachmentItem";
import { useGroupMessage } from "@/utils/stores/chat";
import { text } from "../system/text";

export function GroupMessageItem({ message }: { message: MessageType }) {
    const { status, data } = useSession();
    const [editing, setEditing] = useState(false);
    const query = trpc.group.info.useQuery(
        { groupId: message.group_id },
        { enabled: status === "authenticated", staleTime: Infinity }
    );
    const updateSendbar = useGroupMessage((s) => s.updateSendbar);

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
            onReply={() =>
                updateSendbar(message.group_id, { reply_to: message })
            }
            onDelete={onDelete}
        >
            {message.reply_message != null && (
                <div className="flex flex-row gap-2 items-center overflow-hidden max-w-full border-l-2 border-slate-500 p-2 rounded-md">
                    <p
                        className={text({
                            type: "secondary",
                            size: "sm",
                            className: "font-medium",
                        })}
                    >
                        {message.reply_user?.name}
                    </p>
                    <p
                        className={text({
                            type: "secondary",
                            size: "sm",
                            className: "whitespace-nowrap",
                        })}
                    >
                        {message.reply_message.content}
                    </p>
                </div>
            )}
            {message.reply_id != null && message.reply_message == null && (
                <div className="border-l-2 border-slate-500 p-2 rounded-md">
                    <p className={text({ type: "secondary", size: "sm" })}>
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
