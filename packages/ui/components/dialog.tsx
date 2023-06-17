import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Cross1Icon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type SimpleDialogProps = Pick<
    DialogPrimitive.DialogProps,
    "defaultOpen" | "onOpenChange" | "open"
> & {
    title: string;
    description: string;
    trigger?: ReactNode;
    children: ReactNode;
    contentProps?: DialogPrimitive.DialogContentProps;
};

export function SimpleDialog({
    title,
    description,
    trigger,
    children,
    contentProps,
    ...props
}: SimpleDialogProps) {
    return (
        <DialogPrimitive.Root {...props}>
            {trigger != null && (
                <DialogPrimitive.Trigger asChild>
                    {trigger}
                </DialogPrimitive.Trigger>
            )}
            <DialogContent {...contentProps}>
                <DialogPrimitive.Title className="text-lg font-bold text-accent-900 dark:text-accent-50">
                    {title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-2 text-sm font-normal text-accent-800 dark:text-accent-600">
                    {description}
                </DialogPrimitive.Description>
                {children}
                <DialogPrimitive.Close
                    className={clsx(
                        "absolute top-3.5 right-3.5 inline-flex items-center justify-center rounded-full p-1 text-accent-700 hover:text-accent-900",
                        "focus-visible:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75",
                        "dark:text-accent-700 dark:hover:text-accent-600"
                    )}
                >
                    <Cross1Icon className="h-4 w-4" />
                </DialogPrimitive.Close>
            </DialogContent>
        </DialogPrimitive.Root>
    );
}

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.DialogTrigger;
const DialogClose = DialogPrimitive.DialogClose;

type DialogProps = DialogPrimitive.DialogProps;
type DialogContentProps = DialogPrimitive.DialogContentProps;

function DialogContent(props: DialogPrimitive.DialogContentProps) {
    return (
        <DialogPrimitive.Overlay className="fixed inset-0 z-20 bg-black/50 overflow-y-auto flex backdrop-blur-md">
            <DialogPrimitive.Content
                {...props}
                className={twMerge(
                    "relative m-auto z-50 animate-in fade-in-90 zoom-in-90",
                    "w-[95vw] max-w-md rounded-lg p-4 md:w-full",
                    "bg-light-50 dark:bg-dark-900",
                    "focus:outline-none",
                    props.className
                )}
            >
                {props.children}
            </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
    );
}

export {
    type DialogProps,
    type DialogContentProps,
    Dialog,
    DialogContent,
    DialogClose,
    DialogTrigger,
};
