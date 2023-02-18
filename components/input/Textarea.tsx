import { ComponentProps } from "react";
import { tv, VariantProps } from "tailwind-variants";

const textArea = tv({
    base: [
        "mt-1 block w-full rounded-3xl px-3 py-2",
        "text-base text-accent-900 placeholder:text-accent-600 dark:text-accent-400 dark:placeholder:text-accent-800",
        "border border-accent-500 focus-visible:border-transparent dark:border-accent-900 dark:bg-dark-900",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400 focus-visible:ring-opacity-75",
        "transition-shadow",
    ],
});

export type TextareaProps = ComponentProps<"textarea"> &
    VariantProps<typeof textArea>;

export default function Textarea(props: TextareaProps) {
    return (
        <textarea
            {...props}
            className={textArea({ className: props.className })}
        />
    );
}
