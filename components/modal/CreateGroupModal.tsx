import * as DialogPrimitive from "../Dialog";
import React, { ReactNode, useState } from "react";
import Button from "../Button";
import TextField from "../input/TextField";
import { trpc } from "@/server/client";
import { Spinner } from "../Spinner";
import { ImagePicker } from "../input/ImagePicker";

export type DialogProps = {
    children: ReactNode;
};

export function CreateGroupModal({ children }: DialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
            <DialogPrimitive.Trigger asChild>
                {children}
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay>
                    <Content onClose={() => setIsOpen(false)} />
                </DialogPrimitive.Overlay>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

function Content({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState("");
    const [icon, setIcon] = useState<string | null>(null);
    const utils = trpc.useContext();
    const create = trpc.group.create.useMutation({
        onSuccess(data) {
            utils.group.all.setData(undefined, (groups) =>
                groups != null ? [data, ...groups] : undefined
            );

            onClose();
        },
    });

    return (
        <DialogPrimitive.Content>
            <DialogPrimitive.Title>Create Group</DialogPrimitive.Title>
            <DialogPrimitive.Description>
                Give your chat group a beautiful name and icon
            </DialogPrimitive.Description>
            <form className="mt-2 space-y-2">
                <fieldset>
                    <label
                        htmlFor="icon"
                        className="text-xs font-medium text-gray-700 dark:text-accent-700"
                    >
                        Icon
                    </label>
                    <ImagePicker
                        id="icon"
                        value={icon}
                        onChange={(v) => setIcon(v)}
                        previewClassName="mx-auto w-[100px] aspect-square flex flex-col gap-3 items-center"
                    />
                </fieldset>

                <fieldset>
                    <label
                        htmlFor="firstName"
                        className="text-xs font-medium text-gray-700 dark:text-accent-700"
                    >
                        Name
                    </label>
                    <TextField
                        id="firstName"
                        placeholder="My Group"
                        autoComplete="given-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </fieldset>
            </form>

            <div className="mt-4 flex justify-end">
                <Button
                    variant="primary"
                    onClick={() =>
                        create.mutate({
                            name,
                            icon: icon ?? undefined,
                        })
                    }
                    disabled={create.isLoading}
                >
                    {create.isLoading && (
                        <div className="mr-2">
                            <Spinner />
                        </div>
                    )}
                    Save
                </Button>
            </div>

            <DialogPrimitive.CloseButton />
        </DialogPrimitive.Content>
    );
}
