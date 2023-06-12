import { MessageType } from "@/utils/types";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useState } from "react";

import * as Item from "./MessageItem";
import { AttachmentItem } from "./AttachmentItem";
import { useMessageStore } from "@/utils/stores/chat";
import { useRouter } from "next/router";

export function ChatMessageItem({ message }: { message: MessageType }) {
    const { group } = useRouter().query;

    const { status, data } = useSession();
    const [editing, setEditing] = useState(false);

    const query = trpc.group.info.useQuery(
        { groupId: typeof group === "string" ? Number(group) : NaN },
        {
            enabled: status === "authenticated" && typeof group === "string",
            staleTime: Infinity,
        }
    );

    const updateSendbar = useMessageStore((s) => s.updateSendbar);

    const isAuthor =
        status === "authenticated" && message.author_id === data.user.id;

    const isGroup = typeof group === "string";

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
            channelId: message.channel_id,
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
            canDelete={(isGroup && isAdmin) || isAuthor}
            onCopy={() => navigator.clipboard.writeText(message.content)}
            onEditChange={setEditing}
            onReply={() =>
                updateSendbar(message.channel_id, { reply_to: message })
            }
            onDelete={onDelete}
        >
            {message.reply_id != null && <Reference data={message} />}
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
            <div className="flex flex-col gap-3 mt-3">
                {message.embeds?.map((v, i) => (
                    <div
                        key={i}
                        className="bg-card text-card-foreground p-2 border-l-2 border-l-primary rounded-lg"
                    >
                        <a
                            href={v.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="font-medium text-sm"
                        >
                            {v.title}
                        </a>
                        <p className="text-muted-foreground text-xs">
                            {v.description}
                        </p>
                    </div>
                ))}
            </div>
        </Item.Root>
    );
}

function Reference({ data }: { data: MessageType }) {
    if (data.reply_message == null) {
        return (
            <div className="border-l-2 border-slate-500 p-2 rounded-md">
                <p className="text-sm text-muted-foreground">Message Deleted</p>
            </div>
        );
    }

    return (
        <div className="flex flex-row gap-2 items-center overflow-hidden max-w-full border-l-2 border-slate-500 p-2 rounded-md">
            <p className="font-medium text-sm text-muted-foreground">
                {data.reply_user?.name ?? "Unknown User"}
            </p>
            <p className="whitespace-nowrap text-sm text-muted-foreground">
                {data.reply_message.content}
            </p>
        </div>
    );
}
