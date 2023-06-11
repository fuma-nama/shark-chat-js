import { tv, VariantProps } from "tailwind-variants";

const spinner = tv({
    slots: {
        container: "flex justify-center items-center",
        status: [
            "align-[-0.125rem] border-l-accent-900 animate-spin inline-block rounded-full",
            "dark:border-l-accent-50",
        ],
    },
    variants: {
        size: {
            small: {
                status: "w-4 h-4 border-2",
            },
            medium: {
                status: "w-7 h-7 border-2",
            },
            large: {
                status: "w-10 h-10 border-[3px]",
            },
        },
    },
    defaultVariants: {
        size: "small",
    },
});

export function Spinner({
    size,
    className,
}: VariantProps<typeof spinner> & { className?: string }) {
    const { container, status } = spinner({ size, className });

    return (
        <div className={container()}>
            <div className={status()} role="status" />
        </div>
    );
}
