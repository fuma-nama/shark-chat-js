import { tv } from "tailwind-variants";
export const tabs = tv({
    slots: {
        root: [],
        list: ["flex flex-row"],
        item: [
            "bg-white px-4 py-2 text-sm cursor-pointer font-semibold",
            "radix-state-active:text-white radix-state-active:bg-brand-500 radix-state-inactive:border-[1px] radix-state-inactive:border-accent-500",
            "radix-state-inactive:dark:text-accent-200 dark:radix-state-inactive:border-accent-900 dark:radix-state-active:bg-brand-400 dark:bg-dark-700",
            "first:rounded-l-lg last:rounded-r-lg",
        ],
    },
});
