import { MessageType } from "@/utils/types";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useRef, useState } from "react";

import * as Item from "./MessageItem";
import { AttachmentItem } from "./AttachmentItem";
import { useMessageStore } from "@/utils/stores/chat";
import { useRouter } from "next/router";
import { Spinner } from "ui/components/spinner";
import { Embed } from "db/schema";

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

    const inputRef = useRef<HTMLTextAreaElement | null>(null);
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
            isEditing={editing}
            canEdit={isAuthor}
            canDelete={(isGroup && isAdmin) || isAuthor}
            onCopy={() => navigator.clipboard.writeText(message.content)}
            onEditChange={setEditing}
            onReply={() =>
                updateSendbar(message.channel_id, { reply_to: message })
            }
            onDelete={onDelete}
            onCloseAutoFocus={() => {
                inputRef.current?.focus();
            }}
        >
            <Item.Content user={message.author} timestamp={message.timestamp}>
                {message.reply_id != null && <Reference data={message} />}
                {editing ? (
                    <Item.Edit
                        inputRef={inputRef}
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
                {message.embeds?.map((v, i) => (
                    <div
                        key={i}
                        className="bg-card text-card-foreground mt-3 p-2 border-l-2 border-l-primary rounded-lg"
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
                        {v.image != null && <EmbedImage image={v.image} />}
                    </div>
                ))}
            </Item.Content>
        </Item.Root>
    );
}

function EmbedImage({ image }: { image: Exclude<Embed["image"], undefined> }) {
    const [state, setState] = useState<"loading" | "loaded">("loading");

    return (
        <div
            className="w-auto relative mt-3 rounded-xl overflow-hidden"
            style={{
                maxWidth: `${Math.min(image.width, 400)}px`,
                maxHeight: `${Math.min(image.height, 400)}px`,
                aspectRatio: image.width / image.height,
            }}
        >
            <img
                alt="image"
                src={image.url}
                onLoad={() => setState("loaded")}
                className="w-full h-full"
            />
            {state === "loading" && (
                <div className="flex flex-col justify-center items-center absolute inset-0 bg-light-100 dark:bg-dark-700">
                    <Spinner size="medium" />
                </div>
            )}
        </div>
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
