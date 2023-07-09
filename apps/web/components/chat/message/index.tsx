import { MessageType } from "@/utils/types";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { RefObject, useRef, useState } from "react";

import * as Item from "./atom";
import * as ContextMenu from "ui/components/context-menu";
import { AttachmentItem } from "../AttachmentItem";
import { useMessageStore } from "@/utils/stores/chat";
import { useRouter } from "next/router";
import { CopyIcon, PencilIcon, ReplyIcon, TrashIcon } from "lucide-react";
import Edit from "./edit";
import { Reference } from "./reference";
import { Embed } from "./embed";

export function ChatMessageItem({ message }: { message: MessageType }) {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const embedOnly =
        message.embeds != null &&
        message.embeds.length === 1 &&
        !message.embeds[0].title &&
        !message.embeds[0].description &&
        message.embeds[0].url === message.content;

    return (
        <Item.Root>
            <Item.Content user={message.author} timestamp={message.timestamp}>
                {message.reply_id != null && <Reference data={message} />}
                {editing ? (
                    <Edit
                        inputRef={inputRef}
                        message={message}
                        onCancel={() => setEditing(false)}
                    />
                ) : (
                    !embedOnly && <Item.Text>{message.content}</Item.Text>
                )}
                {message.attachment != null && (
                    <AttachmentItem attachment={message.attachment} />
                )}
                {message.embeds?.map((v, i) => (
                    <Embed key={i} embed={v} />
                ))}
            </Item.Content>
            <Menu
                inputRef={inputRef}
                message={message}
                editing={editing}
                setEditing={setEditing}
            />
        </Item.Root>
    );
}

function Menu({
    message,
    editing,
    setEditing,
    inputRef,
}: {
    message: MessageType;
    editing: boolean;
    setEditing: (v: boolean) => void;
    inputRef: RefObject<HTMLTextAreaElement>;
}) {
    const { status, data } = useSession();
    const { group } = useRouter().query;

    const query = trpc.group.info.useQuery(
        { groupId: typeof group === "string" ? Number(group) : NaN },
        {
            enabled: status === "authenticated" && typeof group === "string",
            staleTime: Infinity,
        }
    );

    const deleteMutation = trpc.chat.delete.useMutation();

    const updateSendbar = useMessageStore((s) => s.updateSendbar);

    const isAuthor =
        status === "authenticated" && message.author_id === data.user.id;

    const isGroup = typeof group === "string";

    const isAdmin =
        query.status === "success" &&
        status === "authenticated" &&
        query.data.owner_id === data.user.id;

    const onDelete = () => {
        deleteMutation.mutate({
            messageId: message.id,
        });
    };

    return (
        <ContextMenu.Content
            onCloseAutoFocus={(e) => {
                inputRef.current?.focus();
                e.preventDefault();
            }}
        >
            <ContextMenu.Item
                icon={<ReplyIcon className="w-4 h-4" />}
                onClick={() =>
                    updateSendbar(message.channel_id, { reply_to: message })
                }
            >
                Reply
            </ContextMenu.Item>
            <ContextMenu.Item
                icon={<CopyIcon className="w-4 h-4" />}
                onClick={() => navigator.clipboard.writeText(message.content)}
            >
                Copy
            </ContextMenu.Item>
            {isAuthor && (
                <ContextMenu.CheckboxItem
                    icon={<PencilIcon className="w-4 h-4" />}
                    value={editing}
                    onChange={() => setEditing(!editing)}
                >
                    {editing ? "Close Edit" : "Edit"}
                </ContextMenu.CheckboxItem>
            )}
            {((isGroup && isAdmin) || isAuthor) && (
                <ContextMenu.Item
                    icon={<TrashIcon className="w-4 h-4" />}
                    color="danger"
                    onClick={onDelete}
                >
                    Delete
                </ContextMenu.Item>
            )}
        </ContextMenu.Content>
    );
}
