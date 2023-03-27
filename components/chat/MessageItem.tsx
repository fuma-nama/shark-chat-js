import { createContext, ReactNode, useContext } from "react";
import { Avatar } from "../system/avatar";
import { Button } from "../system/button";
import { textArea } from "../input/Textarea";

import * as ContextMenu from "../system/context-menu";
import {
    CopyIcon,
    Cross1Icon,
    Pencil1Icon,
    TrashIcon,
} from "@radix-ui/react-icons";
import clsx from "clsx";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import type { Serialize } from "@/utils/types";
import type { MessageType } from "@/server/schema/group";

const MessageContext = createContext<{
    editing: boolean;
    cancel: () => void;
}>({
    editing: false,
    cancel: () => {},
});

type EditProps = {
    initialValue: string;
    isLoading: boolean;
    onEdit: (d: EditPayload) => void;
};

export type EditPayload = { content: string };

export function Edit({ initialValue, isLoading, onEdit }: EditProps) {
    const { cancel } = useContext(MessageContext);
    const { control, handleSubmit } = useForm<EditPayload>({
        defaultValues: {
            content: initialValue,
        },
    });

    const onSave = handleSubmit(onEdit);

    return (
        <>
            <Controller
                control={control}
                name="content"
                render={({ field }) => (
                    <textarea
                        id="edit-message"
                        placeholder="Edit message"
                        autoComplete="off"
                        rows={Math.min(20, field.value.split("\n").length)}
                        wrap="virtual"
                        color="primary"
                        className={textArea({
                            color: "long",
                            className:
                                "resize-none min-h-[80px] h-auto max-h-[50vh]",
                        })}
                        onKeyDown={(e) => {
                            if (e.shiftKey && e.key === "Enter") {
                                e.preventDefault();
                                return onSave();
                            }

                            if (e.key === "Escape") {
                                e.preventDefault();
                                return cancel();
                            }
                        }}
                        {...field}
                    />
                )}
            />
            <label
                htmlFor="edit-message"
                className="text-xs text-accent-800 dark:text-accent-600"
            >
                Press ⇧ enter to save • escape to exit
            </label>

            <div className="flex flex-row gap-3 mt-3">
                <Button color="primary" onClick={onSave} isLoading={isLoading}>
                    Save changes
                </Button>
                <Button
                    color="secondary"
                    onClick={cancel}
                    className="dark:bg-dark-700"
                >
                    Cancel
                </Button>
            </div>
        </>
    );
}

export function Content({
    user,
    timestamp,
    children,
}: {
    user: Serialize<MessageType["author"]>;
    timestamp: string;
    children: ReactNode;
}) {
    const date = new Date(timestamp).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
        hourCycle: "h24",
    });

    return (
        <>
            <Avatar src={user.image} fallback={user.name} />
            <div className="flex-1 flex flex-col">
                <div className="flex flex-row items-center">
                    <Link href={`/dm/${user.id}`} className="font-semibold">
                        {user.name}
                    </Link>
                    <p className="text-xs sm:text-xs text-accent-800 dark:text-accent-600 ml-auto sm:ml-2">
                        {date}
                    </p>
                </div>
                {children}
            </div>
        </>
    );
}

export function Root({
    children,
    isLoading,
    onCopy,
    onDelete,
    isAuthor,
    isEditing,
    onEditChange,
}: {
    isEditing: boolean;
    onEditChange: (v: boolean) => void;
    onCopy: () => void;
    onDelete: () => void;
    isLoading: boolean;
    isAuthor: boolean;
    children: ReactNode;
}) {
    return (
        <ContextMenu.Root
            trigger={
                <div
                    className={clsx(
                        "p-3 rounded-xl bg-light-50 flex flex-row gap-2 shadow-md shadow-brand-500/10",
                        "dark:shadow-none dark:bg-dark-800"
                    )}
                >
                    <MessageContext.Provider
                        value={{
                            editing: isEditing,
                            cancel: () => onEditChange(false),
                        }}
                    >
                        {children}
                    </MessageContext.Provider>
                </div>
            }
        >
            <ContextMenu.Item
                icon={<CopyIcon className="w-4 h-4" />}
                onClick={onCopy}
            >
                Copy
            </ContextMenu.Item>
            {isAuthor && (
                <ContextMenu.CheckboxItem
                    icon={
                        isEditing ? (
                            <Cross1Icon className="w-4 h-4" />
                        ) : (
                            <Pencil1Icon className="w-4 h-4" />
                        )
                    }
                    value={isEditing}
                    disabled={isLoading}
                    onChange={onEditChange}
                >
                    {isEditing ? "Close Edit" : "Edit"}
                </ContextMenu.CheckboxItem>
            )}
            {isAuthor && (
                <ContextMenu.Item
                    icon={<TrashIcon className="w-4 h-4" />}
                    shortcut="⌘+D"
                    color="danger"
                    disabled={isLoading}
                    onClick={onDelete}
                >
                    Delete
                </ContextMenu.Item>
            )}
        </ContextMenu.Root>
    );
}
