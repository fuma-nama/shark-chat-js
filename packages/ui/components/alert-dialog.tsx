import * as Base from "@radix-ui/react-alert-dialog";
import { Button } from "./button";
import { ReactNode } from "react";
import clsx from "clsx";

export type AlertDialogProps = {
    title: string;
    description: string;
    action: ReactNode;
    children: ReactNode;
} & Base.AlertDialogProps;

export function AlertDialog({
    title,
    description,
    action,
    children,
    ...props
}: AlertDialogProps) {
    return (
        <Base.Root {...props}>
            <Base.Trigger asChild>{children}</Base.Trigger>
            <Base.Portal>
                <Base.Overlay className="fixed inset-0 z-20 bg-black/50 overflow-y-auto flex">
                    <Base.Content
                        className={clsx(
                            "relative m-auto z-50 animate-zoom-in",
                            "w-[95vw] max-w-md rounded-lg p-4 md:w-full",
                            "bg-light-50 dark:bg-dark-900",
                            "focus:outline-none"
                        )}
                    >
                        <Base.Title className="text-lg font-bold text-accent-900 dark:text-accent-50">
                            {title}
                        </Base.Title>
                        <Base.Description className="mt-2 text-sm font-normal text-accent-800 dark:text-accent-600">
                            {description}
                        </Base.Description>
                        <div className="flex flex-row gap-3 justify-end mt-6">
                            <Base.Cancel asChild>
                                <Button color="secondary">Cancel</Button>
                            </Base.Cancel>
                            <Base.Action asChild>{action}</Base.Action>
                        </div>
                    </Base.Content>
                </Base.Overlay>
            </Base.Portal>
        </Base.Root>
    );
}
