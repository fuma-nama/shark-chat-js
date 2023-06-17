import { MessageType } from "@/utils/types";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { RefObject, useRef, useState } from "react";

import * as Item from "./atom";
import { AttachmentItem } from "../AttachmentItem";
import { useMessageStore } from "@/utils/stores/chat";
import { useRouter } from "next/router";
import { Spinner } from "ui/components/spinner";
import { Embed } from "db/schema";
import * as ContextMenu from "ui/components/context-menu";
import {
    CopyIcon,
    Pencil1Icon,
    ThickArrowLeftIcon,
    TrashIcon,
} from "@radix-ui/react-icons";
import Edit from "./edit";

export function ChatMessageItem({ message }: { message: MessageType }) {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);

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
                    <Item.Text>{message.content}</Item.Text>
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
            onCloseAutoFocus={() => {
                inputRef.current?.focus();
            }}
        >
            <ContextMenu.Item
                icon={<ThickArrowLeftIcon className="w-4 h-4" />}
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
                    icon={<Pencil1Icon className="w-4 h-4" />}
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

function Embed({ embed }: { embed: Embed }) {
    return (
        <div className="bg-card text-card-foreground mt-3 p-2 border-l-2 border-l-primary rounded-lg">
            <a
                href={embed.url}
                target="_blank"
                rel="noreferrer noopener"
                className="font-medium text-sm"
            >
                {embed.title}
            </a>
            <p className="text-muted-foreground text-xs">{embed.description}</p>
            {embed.image != null && <EmbedImage image={embed.image} />}
        </div>
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
