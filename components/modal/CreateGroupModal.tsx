import * as DialogPrimitive from "../Dialog";
import React, { ReactElement, useState } from "react";
import Button from "../Button";
import TextField from "../input/TextField";

export type DialogProps = {
    children: ReactElement;
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
                    <DialogPrimitive.Content>
                        <DialogPrimitive.Title>
                            Create Group
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Description>
                            Give your chat group a beautiful name and icon
                        </DialogPrimitive.Description>
                        <form className="mt-2 space-y-2">
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
                                />
                            </fieldset>
                        </form>

                        <div className="mt-4 flex justify-end">
                            <DialogPrimitive.Close asChild>
                                <Button variant="primary">Save</Button>
                            </DialogPrimitive.Close>
                        </div>

                        <DialogPrimitive.CloseButton />
                    </DialogPrimitive.Content>
                </DialogPrimitive.Overlay>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
