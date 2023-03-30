import * as Base from "@radix-ui/react-switch";
import { forwardRef } from "react";
import { tv } from "tailwind-variants";

const switchStyles = tv({
    slots: {
        root: [
            "relative rounded-full bg-light-400 radix-state-checked:bg-brand-500",
            "dark:bg-dark-700 dark:radix-state-checked:bg-brand-400",
            "radix-disabled:opacity-50 radix-disabled:cursor-not-allowed",
        ],
        thumb: [
            "block bg-white rounded-full h-full w-auto aspect-square transition-transform",
            "radix-state-unchecked:translate-x-0",
        ],
    },
    variants: {
        size: {
            md: {
                root: "w-14 h-7 p-1",
                thumb: "radix-state-checked:translate-x-7",
            },
        },
    },
    defaultVariants: {
        size: "md",
    },
});

export type SwitchProps = Base.SwitchProps & {};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
    (props, ref) => {
        const styles = switchStyles();

        return (
            <Base.Root
                {...props}
                ref={ref}
                className={styles.root({ className: props.className })}
            >
                <Base.Thumb className={styles.thumb()} />
            </Base.Root>
        );
    }
);

Switch.displayName = "switch";
