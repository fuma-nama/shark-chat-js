import { MutableRefObject, ReactNode, useMemo } from "react";
import { Avatar } from "ui/components/avatar";
import { Button } from "ui/components/button";
import { textArea } from "ui/components/textarea";

import * as ContextMenu from "ui/components/context-menu";
import {
    CopyIcon,
    Cross1Icon,
    Pencil1Icon,
    ThickArrowLeftIcon,
    TrashIcon,
} from "@radix-ui/react-icons";
import { Controller, useForm } from "react-hook-form";

import { MessageType } from "@/utils/types";
import { linkIt, urlRegex } from "react-linkify-it";
import { UserProfileModal } from "../modal/UserProfileModal";
import { DialogTrigger } from "ui/components/dialog";
import { cn } from "ui/utils/cn";

export type EditPayload = { content: string };

type EditProps = {
    initialValue: string;
    isLoading: boolean;
    onEdit: (d: EditPayload) => void;
    inputRef: MutableRefObject<HTMLTextAreaElement | null>;
    onCancel: () => void;
};

export function Edit({
    initialValue,
    isLoading,
    onEdit,
    inputRef,
    onCancel,
}: EditProps) {
    const { control, handleSubmit } = useForm<EditPayload>({
        defaultValues: {
            content: initialValue,
        },
    });

    const onSave = handleSubmit(onEdit);

    return (
        <form onSubmit={onSave}>
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
                        className={textArea({
                            color: "long",
                            className:
                                "resize-none min-h-[80px] h-auto max-h-[50vh]",
                        })}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                return onSave();
                            }

                            if (e.key === "Escape") {
                                e.preventDefault();
                                return onCancel();
                            }
                        }}
                        {...field}
                        ref={(e) => {
                            field.ref(e);

                            if (inputRef != null) {
                                inputRef.current = e;
                            }
                        }}
                    />
                )}
            />
            <label
                htmlFor="edit-message"
                className="text-xs text-accent-800 dark:text-accent-600"
            >
                Press enter to save • escape to exit
            </label>

            <div className="flex flex-row gap-3 mt-3">
                <Button color="primary" isLoading={isLoading}>
                    Save changes
                </Button>
                <Button
                    type="button"
                    color="secondary"
                    onClick={onCancel}
                    className="dark:bg-dark-700"
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}

type ContentProps = {
    user: MessageType["author"];
    timestamp: string | Date | number;
    className?: string;
    children: ReactNode;
};

export function Content({ user, timestamp, children, ...props }: ContentProps) {
    const author = user ?? {
        id: "",
        image: null,
        name: "Deleted User",
    };
    const date = new Date(timestamp).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
        hourCycle: "h24",
    });

    return (
        <ContextMenu.Trigger
            className={cn(
                "p-3 rounded-xl bg-light-50 flex flex-row gap-2",
                "dark:bg-dark-800",
                props.className
            )}
        >
            <UserProfileModal userId={author.id}>
                <DialogTrigger asChild>
                    <Avatar
                        src={author.image}
                        className="cursor-pointer"
                        fallback={author.name}
                    />
                </DialogTrigger>
                <div className="flex-1 flex flex-col w-0">
                    <div className="flex flex-row items-center">
                        <DialogTrigger asChild>
                            <p className="font-semibold cursor-pointer">
                                {author.name}
                            </p>
                        </DialogTrigger>

                        <p className="text-xs sm:text-xs text-muted-foreground ml-auto sm:ml-2">
                            {date}
                        </p>
                    </div>

                    {children}
                </div>
            </UserProfileModal>
        </ContextMenu.Trigger>
    );
}

type RootProps = {
    isEditing: boolean;
    onEditChange: (v: boolean) => void;
    onCopy: () => void;
    onReply: () => void;
    onDelete: () => void;
    canEdit: boolean;
    canDelete: boolean;
} & ContextMenu.ContentProps;

export function Root({
    children,
    onCopy,
    onDelete,
    canDelete,
    canEdit,
    isEditing,
    onEditChange,
    onReply,
    ...props
}: RootProps) {
    return (
        <ContextMenu.Root>
            {children}
            <ContextMenu.Content {...props}>
                <ContextMenu.Item
                    icon={<ThickArrowLeftIcon className="w-4 h-4" />}
                    onClick={onReply}
                >
                    Reply
                </ContextMenu.Item>
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
            </ContextMenu.Content>
        </ContextMenu.Root>
    );
}

export function Text({ children }: { children: string }) {
    const nodes = useMemo(() => {
        return linkIt(
            children,
            (url, key) => (
                <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-500 dark:text-brand-200"
                >
                    {url}
                </a>
            ),
            urlRegex
        );
    }, [children]);

    return (
        <p className="[overflow-wrap:anywhere] [white-space:break-spaces]">
            {nodes}
        </p>
    );
}
