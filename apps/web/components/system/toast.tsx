import * as Base from "@radix-ui/react-toast";
import { usePageStore } from "@/utils/stores/page";
import { ReactNode } from "react";
import { text } from "./text";
import { tv, VariantProps } from "tailwind-variants";
import { Cross1Icon } from "@radix-ui/react-icons";

export const toast = tv({
    slots: {
        root: [
            "relative rounded-xl bg-white dark:bg-dark-800 p-3 shadow-2xl shadow-brand-500/10",
            "dark:shadow-none",
            "radix-state-open:animate-zoom-in",
        ],
        heading: text({ type: "primary", size: "lg" }),
        body: text({ type: "secondary" }),
    },
    variants: {
        color: {
            red: {
                root: "border-[1px] border-red-500 bg-red-500 dark:bg-red-500",
                heading: "!text-white",
                body: "!text-white",
            },
            normal: {
                root: "dark:border-2 dark:border-dark-600",
            },
        },
    },
    defaultVariants: {
        color: "normal",
    },
});

export function ToastProvider({ children }: { children?: ReactNode }) {
    const [messages, remove] = usePageStore((s) => [
        s.messages,
        s.removeMessage,
    ]);

    return (
        <Base.Provider swipeDirection="right">
            {messages.map((error) => (
                <Toast
                    key={error.id}
                    title={error.title}
                    description={error.description}
                    color={error.variant}
                    onOpenChange={(open) => {
                        if (!open) {
                            remove(error.id);
                        }
                    }}
                />
            ))}
            {children}
            <Base.Viewport className="fixed bottom-0 right-0 z-50 w-[30rem] max-w-[100vw] p-3 flex flex-col gap-3 list-none" />
        </Base.Provider>
    );
}

export type ToastProps = Omit<Base.ToastProps, "color"> & {
    title: string;
    description: string;
} & VariantProps<typeof toast>;

export function Toast({
    title,
    description,
    children,
    color,
    ...rest
}: ToastProps) {
    const styles = toast({ color });

    return (
        <Base.Root {...rest} className={styles.root()}>
            <Base.Title className={styles.heading()}>{title}</Base.Title>
            <Base.Description className={styles.body()}>
                {description}
            </Base.Description>
            <Base.ToastClose
                asChild
                className="absolute right-3 top-3 cursor-pointer"
            >
                <Cross1Icon />
            </Base.ToastClose>
            {children}
        </Base.Root>
    );
}
