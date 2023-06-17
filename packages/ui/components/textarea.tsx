import { tv } from "tailwind-variants";

export const textArea = tv({
    base: [
        "block w-full text-base text-foreground bg-background",
        "placeholder:text-muted-foreground/70",
        "focus:outline-none",
    ],
    variants: {
        color: {
            primary: [
                "rounded-md p-1.5 bg-transparent",
                "max-sm:bg-background max-sm:mx-2 max-sm:p-2 max-sm:rounded-2xl",
            ],
            long: "rounded-md px-2 py-1 border dark:bg-dark-900",
        },
    },
    defaultVariants: {
        color: "long",
    },
});
