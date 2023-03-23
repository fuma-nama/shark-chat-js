import { tv } from "tailwind-variants";

export const skeleton = tv({
    base: "inline-block rounded-lg bg-light-300 dark:bg-dark-700",
    variants: {
        len: {
            short: "w-28 h-6 my-auto",
        },
    },
    defaultVariants: {
        len: "short",
    },
});
