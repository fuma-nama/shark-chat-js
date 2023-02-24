import { Serialize } from "@/utils/types";
import type { Message } from "@prisma/client";
import { User } from "next-auth";
import { ReactNode, useState } from "react";
import Avatar from "../Avatar";
import Button from "../Button";
import Textarea from "../input/Textarea";

import * as ContextMenu from "../ContextMenu";
import { Cross1Icon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { trpc } from "@/utils/trpc";
import { Spinner } from "../Spinner";

export function MessageItem({
    message,
}: {
    message: Serialize<Message & { author: User }>;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const deleteMutation = trpc.chat.delete.useMutation();

    const date = new Date(message.timestamp).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
        hourCycle: "h24",
    });

    const onDelete = () => {
        deleteMutation.mutate({
            messageId: message.id,
            groupId: message.group_id,
        });
    };

    return (
        <MessageMenu
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            onDelete={onDelete}
        >
            <div
                className={clsx(
                    "p-3 rounded-xl bg-light-50 flex flex-row gap-2 shadow-md shadow-brand-500/10",
                    "dark:shadow-none dark:bg-dark-800"
                )}
            >
                <Avatar
                    src={message.author.image}
                    fallback={message.author.name!!}
                />
                <div className="flex-1 flex flex-col">
                    <div className="flex flex-row items-center">
                        <p className="font-semibold">{message.author.name}</p>
                        <p className="text-xs sm:text-xs text-accent-800 dark:text-accent-600 ml-auto sm:ml-2">
                            {date}
                        </p>
                    </div>

                    {isEditing ? (
                        <EditMessage
                            message={message}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <p className="whitespace-pre">{message.content}</p>
                    )}
                </div>
            </div>
        </MessageMenu>
    );
}

function EditMessage({
    onCancel,
    message,
}: {
    onCancel: () => void;
    message: Serialize<Message & { author: User }>;
}) {
    const [edit, setEdit] = useState<string>(message.content);

    const editMutation = trpc.chat.update.useMutation({
        onSuccess: onCancel,
    });

    const onSave = () => {
        if (edit == null) return;

        editMutation.mutate({
            content: edit,
            messageId: message.id,
            groupId: message.group_id,
        });
    };

    return (
        <>
            <Textarea
                id="edit-message"
                value={edit}
                onChange={(e) => setEdit(e.target.value)}
                className="resize-none"
                placeholder="Edit message"
                autoComplete="off"
                onKeyDown={(e) => {
                    if (e.shiftKey && e.key === "Enter") {
                        return onSave();
                    }

                    if (e.key === "Escape") {
                        return onCancel();
                    }
                }}
            />
            <label
                htmlFor="edit-message"
                className="text-xs text-accent-800 dark:text-accent-600"
            >
                editing the message
            </label>

            <div className="flex flex-row gap-3 mt-3">
                <Button
                    color="primary"
                    onClick={onSave}
                    disabled={editMutation.isLoading}
                >
                    {editMutation.isLoading && (
                        <div className="inline mr-2">
                            <Spinner size="small" />
                        </div>
                    )}
                    Save changes
                </Button>
                <Button color="secondary" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </>
    );
}

function MessageMenu({
    isEditing,
    setIsEditing,
    onDelete,
    children,
}: {
    isEditing: boolean;
    setIsEditing: (v: boolean) => void;
    onDelete: () => void;
    children: ReactNode;
}) {
    return (
        <ContextMenu.Root trigger={children}>
            <ContextMenu.CheckboxItem
                icon={
                    isEditing ? (
                        <Cross1Icon className="w-4 h-4" />
                    ) : (
                        <Pencil1Icon className="w-4 h-4" />
                    )
                }
                value={isEditing}
                onChange={setIsEditing}
            >
                {isEditing ? "Close Edit" : "Edit"}
            </ContextMenu.CheckboxItem>
            <ContextMenu.Item
                icon={<TrashIcon className="w-4 h-4" />}
                shortcut="⌘+D"
                color="danger"
                onClick={onDelete}
            >
                Delete
            </ContextMenu.Item>
        </ContextMenu.Root>
    );
}
