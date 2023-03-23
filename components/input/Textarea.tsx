import { tv } from "tailwind-variants";

export const textArea = tv({
    base: [
        "block w-full",
        "text-base border border-accent-500 text-accent-900 placeholder:text-accent-600 dark:text-accent-400 dark:placeholder:text-accent-800",
        "dark:bg-dark-900 dark:border-accent-900",
        "focus:outline-none",
    ],
    variants: {
        color: {
            primary: [
                "rounded-3xl px-3 py-2",
                "border border-accent-500 focus-visible:border-transparent",
                "focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-opacity-75",
                "dark:bg-dark-900 dark:focus-visible:ring-brand-400",
                "transition-shadow",
            ],
            long: ["rounded-md px-2 py-1", "dark:bg-dark-900"],
        },
    },
    defaultVariants: {
        color: "long",
    },
});
