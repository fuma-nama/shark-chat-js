import React, { ReactNode, useState } from "react";
import Button from "../Button";
import TextField from "../input/TextField";
import { trpc } from "@/server/client";
import { Spinner } from "../Spinner";
import { ImagePicker } from "../input/ImagePicker";
import { Dialog } from "../Dialog";

export type DialogProps = {
    children: ReactNode;
};

export function CreateGroupModal({ children }: DialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog
            title="Create Group"
            description="Give your chat group a beautiful name and icon"
            open={isOpen}
            onOpenChange={setIsOpen}
            trigger={children}
        >
            <Content onClose={() => setIsOpen(false)} />
        </Dialog>
    );
}

function Content({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState("");
    const [icon, setIcon] = useState<string | null>(null);
    const create = trpc.group.create.useMutation({
        onSuccess: onClose,
    });

    return (
        <>
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
                        previewClassName="mx-auto w-[120px] aspect-square flex flex-col gap-3 items-center"
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
                    color="primary"
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
        </>
    );
}
