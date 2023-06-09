import * as Base from "@radix-ui/react-popover";
import { ReactNode } from "react";
import { tv } from "tailwind-variants";

export const popover = tv({
    slots: {
        content: [
            "rounded-lg p-4 bg-light-50 flex flex-col gap-3 z-10 animate-zoom-in shadow-brand-300/10 shadow-xl",
            "dark:shadow-none dark:bg-dark-950",
            "focus:outline-none",
        ],
        arrow: ["fill-light-50", "dark:fill-dark-950"],
    },
});

export function Popover({
    trigger,
    children,
}: {
    trigger: ReactNode;
    children: ReactNode;
}) {
    const styles = popover();

    return (
        <Base.Root>
            <Base.Anchor>
                <Base.Trigger asChild>{trigger}</Base.Trigger>
            </Base.Anchor>

            <Base.Portal>
                <Base.Content className={styles.content()}>
                    <Base.Arrow className={styles.arrow()} />
                    {children}
                </Base.Content>
            </Base.Portal>
        </Base.Root>
    );
}
