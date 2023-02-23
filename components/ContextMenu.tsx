import { tv, VariantProps } from "tailwind-variants";

export const contextMenu = tv({
    slots: {
        content: [
            "bg-white shadow-xl shadow-brand-500/10 rounded-2xl p-1 py-2",
            "dark:bg-dark-900 dark:shadow-brand-700/50",
        ],
    },
});

export type MenuItemVariants = VariantProps<typeof menuItem>;
export const menuItem = tv({
    slots: {
        root: [
            "flex flex-row items-center gap-12 pl-6 pr-2 py-1 text-sm rounded-md cursor-pointer group",
        ],
        right: ["ml-auto text-accent-600 group-radix-highlighted:text-white"],
    },
    variants: {
        color: {
            secondary: {
                root: [
                    "text-accent-900",
                    "dark:text-accent-400",
                    "radix-highlighted:text-white radix-highlighted:bg-brand-500 radix-highlighted:outline-none",
                ],
            },
            danger: {
                root: [
                    "text-red-500",
                    "dark:text-red-400 dark:radix-highlighted:text-white",
                    "radix-highlighted:text-white radix-highlighted:bg-red-500 radix-highlighted:outline-none",
                ],
            },
        },
    },
    defaultVariants: {
        color: "secondary",
    },
});
