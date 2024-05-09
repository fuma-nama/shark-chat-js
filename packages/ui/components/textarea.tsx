import { tv } from "tailwind-variants";

export const textArea = tv({
  base: [
    "text-[16px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none",
  ],
  variants: {
    color: {
      primary:
        "bg-secondary px-3 py-2 transition-colors resize-none sm:py-1.5 sm:px-0 sm:bg-transparent max-sm:rounded-3xl max-sm:focus-visible:bg-accent",
      long: "bg-muted rounded-md px-2 py-1 border",
    },
  },
  defaultVariants: {
    color: "long",
  },
});
