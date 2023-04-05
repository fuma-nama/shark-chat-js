import { createContext, forwardRef, ReactNode, useContext } from "react";
import { Avatar } from "../system/avatar";
import { Button } from "../system/button";
import { textArea } from "../system/textarea";

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
import type { MessageType } from "@/server/schema/chat";
import { LinkItUrl } from "react-linkify-it";

const MessageContext = createContext<{
    cancel: () => void;
}>({
    cancel: () => {},
});

export type EditPayload = { content: string };

type EditProps = {
    initialValue: string;
    isLoading: boolean;
    onEdit: (d: EditPayload) => void;
};

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

type ContentProps = {
    user: Serialize<MessageType["author"]>;
    timestamp: string | Date | number;
    children: ReactNode;
};

function Content({ user, timestamp, children }: ContentProps) {
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

type RootProps = {
    isEditing: boolean;
    onEditChange: (v: boolean) => void;
    onCopy: () => void;
    onDelete: () => void;
    canEdit: boolean;
    canDelete: boolean;

    user: Serialize<MessageType["author"]>;
    timestamp: string | Date | number;
    children: ReactNode;
};

export function Root({
    children,
    onCopy,
    onDelete,
    canDelete,
    canEdit,
    isEditing,
    onEditChange,
    ...rest
}: RootProps & ContentProps) {
    return (
        <ContextMenu.Root
            trigger={
                <div
                    className={clsx(
                        "p-3 rounded-xl bg-light-50 flex flex-row gap-2 shadow-md shadow-brand-500/10",
                        "dark:shadow-none dark:bg-dark-800"
                    )}
                >
                    <Content {...rest}>
                        <MessageContext.Provider
                            value={{
                                cancel: () => onEditChange(false),
                            }}
                        >
                            {children}
                        </MessageContext.Provider>
                    </Content>
                </div>
            }
        >
            <ContextMenu.Item
                icon={<CopyIcon className="w-4 h-4" />}
                onClick={onCopy}
            >
                Copy
            </ContextMenu.Item>
            {canEdit && (
                <ContextMenu.CheckboxItem
                    icon={
                        isEditing ? (
                            <Cross1Icon className="w-4 h-4" />
                        ) : (
                            <Pencil1Icon className="w-4 h-4" />
                        )
                    }
                    value={isEditing}
                    onChange={() => onEditChange(!isEditing)}
                >
                    {isEditing ? "Close Edit" : "Edit"}
                </ContextMenu.CheckboxItem>
            )}
            {canDelete && (
                <ContextMenu.Item
                    icon={<TrashIcon className="w-4 h-4" />}
                    shortcut="⌘+D"
                    color="danger"
                    onClick={onDelete}
                >
                    Delete
                </ContextMenu.Item>
            )}
        </ContextMenu.Root>
    );
}

export function Text({ children }: { children: string }) {
    return (
        <p className="block [word-wrap:break-word] [white-space:break-spaces] [overflow-wrap:break-word]">
            <LinkItUrl className="text-brand-500 dark:text-purple-300">
                {children}
            </LinkItUrl>
        </p>
    );
}
