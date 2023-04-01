import { tv } from "tailwind-variants";

export const badge = tv({
    base: [
        "absolute top-4 right-4 px-2 py-[2px] rounded-full bg-brand-500 text-white text-sm font-semibold",
        "dark:bg-brand-400",
    ],
});
