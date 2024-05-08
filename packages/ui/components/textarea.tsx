import { tv } from "tailwind-variants";

export const textArea = tv({
  base: [
    "text-[16px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none",
  ],
  variants: {
    color: {
      primary:
        "py-1.5 bg-transparent max-sm:bg-secondary max-sm:px-3 max-sm:py-2 max-sm:rounded-3xl transition-colors max-sm:focus-visible:bg-accent",
      long: "bg-muted rounded-md px-2 py-1 border",
    },
  },
  defaultVariants: {
    color: "long",
  },
});
