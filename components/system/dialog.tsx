import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Cross1Icon } from "@radix-ui/react-icons";
import { ReactNode } from "react";
import { tv, VariantProps } from "tailwind-variants";

export const dialog = tv({
    slots: {
        close: [
            "absolute top-3.5 right-3.5 inline-flex items-center justify-center rounded-full p-1",
            "focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75",
        ],
        content: [
            "relative m-auto z-50 animate-zoom-in",
            "w-[95vw] max-w-md rounded-lg p-4 md:w-full",
            "bg-light-50 dark:bg-dark-900",
            "focus:outline-none",
        ],
        overlay: "fixed inset-0 z-20 bg-black/50 overflow-y-auto flex",
        title: "text-lg font-bold text-accent-900 dark:text-accent-50",
        description:
            "mt-2 text-sm font-normal text-accent-800 dark:text-accent-600",
    },
});

export type DialogProps = Pick<
    DialogPrimitive.DialogProps,
    "defaultOpen" | "onOpenChange" | "open"
> &
    VariantProps<typeof dialog> & {
        title: string;
        description: string;
        trigger?: ReactNode;
        children: ReactNode;
        contentProps?: DialogPrimitive.DialogContentProps;
    };

export function Dialog({
    title,
    description,
    trigger,
    children,
    contentProps,
    ...props
}: DialogProps) {
    const styles = dialog();

    return (
        <DialogPrimitive.Root {...props}>
            {trigger != null && (
                <DialogPrimitive.Trigger asChild>
                    {trigger}
                </DialogPrimitive.Trigger>
            )}
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className={styles.overlay()}>
                    <DialogPrimitive.Content
                        className={styles.content()}
                        {...contentProps}
                    >
                        <DialogPrimitive.Title className={styles.title()}>
                            {title}
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Description
                            className={styles.description()}
                        >
                            {description}
                        </DialogPrimitive.Description>
                        {children}
                        <CloseButton className={styles.close()} />
                    </DialogPrimitive.Content>
                </DialogPrimitive.Overlay>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

export function CloseButton({ className }: { className: string }) {
    return (
        <DialogPrimitive.Close className={className}>
            <Cross1Icon className="h-4 w-4 text-accent-700 hover:text-accent-900 dark:text-accent-700 dark:hover:text-accent-600" />
        </DialogPrimitive.Close>
    );
}
