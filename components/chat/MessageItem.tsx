import { Serialize } from "@/utils/types";
import type { Message } from "@prisma/client";
import { User } from "next-auth";
import { ReactNode, useState } from "react";
import Avatar from "../Avatar";
import Button from "../Button";
import Textarea from "../input/Textarea";

import * as ContextMenu from "@radix-ui/react-context-menu";
import { contextMenu, menuItem, MenuItemVariants } from "../ContextMenu";
import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { VariantProps } from "tailwind-variants";

export function MessageItem({
    message,
}: {
    message: Serialize<Message & { author: User }>;
}) {
    const [edit, setEdit] = useState<{
        message: string;
    } | null>(null);

    return (
        <MessageMenu>
            <div className="p-3 rounded-xl bg-light-50 dark:bg-dark-800 flex flex-row gap-2 shadow-md dark:shadow-none shadow-brand-500/10">
                <Avatar
                    src={message.author.image}
                    fallback={message.author.name!!}
                />
                <div className="flex-1 flex flex-col">
                    <div className="flex flex-row items-center">
                        <p className="font-semibold">{message.author.name}</p>
                        <p className="text-xs sm:text-xs text-accent-800 dark:text-accent-600 ml-auto sm:ml-2">
                            {new Date(message.timestamp).toLocaleString(
                                undefined,
                                {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                    hourCycle: "h24",
                                }
                            )}
                        </p>
                    </div>

                    {edit != null ? (
                        <>
                            <Textarea
                                id="edit-message"
                                value={edit.message}
                                onChange={(e) =>
                                    setEdit({ message: e.target.value })
                                }
                                className="resize-none"
                                placeholder="Edit message"
                                autoComplete="off"
                            />
                            <label
                                htmlFor="edit-message"
                                className="text-xs text-accent-800 dark:text-accent-600"
                            >
                                editing the message
                            </label>
                        </>
                    ) : (
                        <p className="whitespace-pre">{message.content}</p>
                    )}
                    <div className="flex flex-row gap-3 mt-3">
                        <Button
                            color="primary"
                            onClick={() =>
                                setEdit({ message: message.content })
                            }
                        >
                            Edit
                        </Button>
                    </div>
                </div>
            </div>
        </MessageMenu>
    );
}

function MessageMenu({ children }: { children: ReactNode }) {
    const styles = contextMenu({});

    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content className={styles.content()}>
                    <MenuItem
                        icon={<Pencil1Icon className="w-4 h-4" />}
                        shortcut="⌘+["
                    >
                        Edit
                    </MenuItem>
                    <MenuItem
                        icon={<TrashIcon className="w-4 h-4" />}
                        shortcut="⌘+D"
                        color="danger"
                    >
                        Delete
                    </MenuItem>
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    );
}

type MenuItemProps = MenuItemVariants & {
    children: ReactNode;
    shortcut: string;
    icon?: ReactNode;
};

function MenuItem({ children, shortcut, icon, color }: MenuItemProps) {
    const item = menuItem({ color });

    return (
        <ContextMenu.Item className={item.root()}>
            <p className="flex flex-row gap-1 items-center -ml-5">
                {icon} {children}
            </p>

            <div className={item.right()}>{shortcut}</div>
        </ContextMenu.Item>
    );
}
