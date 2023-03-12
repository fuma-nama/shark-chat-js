import { tv, VariantProps } from "tailwind-variants";

const spinner = tv({
    slots: {
        container: "flex justify-center items-center",
        status: "align-[-0.125rem] border-r-transparent animate-spin inline-block rounded-full",
    },
    variants: {
        size: {
            small: {
                status: "w-4 h-4 border-2",
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

export function Spinner({ size }: VariantProps<typeof spinner>) {
    const { container, status } = spinner({ size });

    return (
        <div className={container()}>
            <div className={status()} role="status" />
        </div>
    );
}
