import React from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const button = tv({
    base: [
        "inline-flex select-none items-center justify-center text-start",
        "focus:outline-none focus-visible:ring",
        // Register all radix states
        "group",
        "radix-state-on:bg-light-100 dark:radix-state-on:bg-dark-900",
        "radix-state-instant-open:bg-light-100 radix-state-delayed-open:bg-light-50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
    ],
    variants: {
        color: {
            primary: [
                "rounded-lg transition-colors shadow-lg shadow-brand-400/50",
                "bg-brand-500 hover:bg-brand-400 dark:bg-brand-400 text-gray-50 dark:hover:bg-brand-500 dark:shadow-none",
                "focus-visible:ring-0",
            ],
            secondary: [
                "rounded-md transition-colors shadow-xl shadow-light-200",
                "bg-white text-gray-700 hover:bg-light-200 dark:bg-dark-800 dark:text-gray-50 dark:hover:bg-dark-700 dark:shadow-none",
                "focus-visible:ring-0",
            ],
            danger: [
                "rounded-md transition-colors",
                "bg-red-500 hover:bg-red-400 dark:bg-red-500 text-gray-50 dark:hover:bg-red-600",
                "focus-visible:ring-0",
            ],
        },
        size: {
            large: "px-6 py-3 text-base font-semibold",
            medium: "px-4 py-2 text-sm font-semibold",
        },
    },
    defaultVariants: {
        color: "secondary",
        size: "medium",
    },
});

export type ButtonProps = React.ComponentProps<"button"> &
    VariantProps<typeof button>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, color, size, ...props }, ref) => (
        <button
            ref={ref}
            {...props}
            className={button({ color, size, className: props.className })}
        >
            {children}
        </button>
    )
);

Button.displayName = "Button";
export default Button;
