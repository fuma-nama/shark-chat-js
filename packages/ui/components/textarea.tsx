import { tv } from "tailwind-variants";

export const textArea = tv({
    base: [
        "block w-full text-base text-foreground",
        "placeholder:text-muted-foreground/70",
        "focus:outline-none",
    ],
    variants: {
        color: {
            primary: [
                "rounded-md p-1.5 bg-transparent",
                "max-sm:bg-muted max-sm:mx-2 max-sm:px-3 max-sm:py-1.5 max-sm:rounded-2xl",
            ],
            long: "bg-muted rounded-md px-2 py-1 border",
        },
    },
    defaultVariants: {
        color: "long",
    },
});
