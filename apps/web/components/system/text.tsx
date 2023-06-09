import { tv } from "tailwind-variants";

export const label = tv({
    base: "text-[0.875rem] font-medium text-gray-700 dark:text-accent-400",
});

export const text = tv({
    variants: {
        type: {
            secondary: ["text-accent-800 dark:text-accent-600"],
            primary: ["text-accent-900 dark:text-accent-50"],
            error: ["text-red-400 dark:text-red-400"],
        },
        size: {
            "2xl": ["text-2xl font-bold"],
            xl: ["text-xl font-bold"],
            lg: ["text-lg font-semibold"],
            md: ["text-base font-medium"],
            sm: ["text-sm"],
            xs: ["text-xs"],
        },
    },
    defaultVariants: { type: "secondary" },
});
