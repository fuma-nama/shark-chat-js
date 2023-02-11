import * as DialogPrimitive from "@radix-ui/react-dialog";
import type {
    DialogContentProps,
    DialogDescriptionProps,
    DialogOverlayProps,
    DialogTitleProps,
} from "@radix-ui/react-dialog";
import clsx from "clsx";
import { forwardRef } from "react";
import { Cross1Icon } from "@radix-ui/react-icons";

export const Root = DialogPrimitive.Root;
export const Trigger = DialogPrimitive.Trigger;
export const Portal = DialogPrimitive.Portal;
export const Overlay = forwardRef<
    HTMLDivElement,
    Omit<DialogOverlayProps, "className">
>((props, ref) => (
    <DialogPrimitive.Overlay
        {...props}
        ref={ref}
        className={clsx(
            "fixed inset-0 z-20 bg-black/50 overflow-y-auto flex animate-fade-in"
        )}
    />
));

Overlay.displayName = "Dialog Overlay";

export const Content = forwardRef<
    HTMLDivElement,
    Omit<DialogContentProps, "className">
>((props, ref) => (
    <DialogPrimitive.Content
        {...props}
        ref={ref}
        className={clsx(
            "relative m-auto z-50",
            "w-[95vw] max-w-md rounded-lg p-4 md:w-full",
            "bg-light-50 dark:bg-dark-900",
            "focus:outline-none"
        )}
    />
));

Content.displayName = "Dialog Content";

export const Title = forwardRef<
    HTMLHeadingElement,
    Omit<DialogTitleProps, "className">
>((props, ref) => (
    <DialogPrimitive.Title
        {...props}
        ref={ref}
        className="text-lg font-bold text-accent-900 dark:text-accent-50"
    />
));

Title.displayName = "Dialog Title";

export const Description = forwardRef<
    HTMLParagraphElement,
    Omit<DialogDescriptionProps, "className">
>((props, ref) => (
    <DialogPrimitive.Description
        {...props}
        ref={ref}
        className="mt-2 text-sm font-normal text-accent-800 dark:text-accent-600"
    />
));

Description.displayName = "Dialog Description";

export const Close = DialogPrimitive.Close;

export function CloseButton() {
    return (
        <DialogPrimitive.Close
            className={clsx(
                "absolute top-3.5 right-3.5 inline-flex items-center justify-center rounded-full p-1",
                "focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75"
            )}
        >
            <Cross1Icon className="h-4 w-4 text-accent-700 hover:text-accent-900 dark:text-accent-700 dark:hover:text-accent-600" />
        </DialogPrimitive.Close>
    );
}
