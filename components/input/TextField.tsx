import clsx from "clsx";
import { ComponentProps } from "react";
import { tv, VariantProps } from "tailwind-variants";

export type TextFieldProps = ComponentProps<"input"> &
    VariantProps<typeof input>;

const input = tv({
    base: [
        "block w-full rounded-md px-3 py-2",
        "text-sm text-accent-900 placeholder:text-accent-600 dark:text-accent-400 dark:placeholder:text-accent-700",
        "border border-accent-500 focus-visible:border-transparent dark:border-accent-900 dark:bg-dark-800",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400 focus-visible:ring-opacity-75",
        "transition-shadow",
    ],
});

export default function TextField(props: TextFieldProps) {
    return (
        <input
            {...props}
            type="text"
            className={input({ className: props.className })}
        />
    );
}
