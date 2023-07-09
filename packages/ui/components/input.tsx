import { tv } from "tailwind-variants";

export const input = tv({
    base: [
        "block w-full border rounded-md px-3 py-2 bg-secondary transition-shadow text-sm text-foreground placeholder:text-muted-foreground/70",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400 focus-visible:ring-opacity-75 focus-visible:border-transparent",
    ],
});
