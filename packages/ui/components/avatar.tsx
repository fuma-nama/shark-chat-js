"use client";
import * as AvatarBase from "@radix-ui/react-avatar";
import { useMemo } from "react";
import { tv, VariantProps } from "tailwind-variants";

const avatar = tv({
    slots: {
        root: "relative inline-flex aspect-square overflow-hidden",
        image: "h-full w-full object-cover",
        fallback:
            "flex h-full w-full text-center items-center justify-center bg-primary text-primary-foreground text-sm font-medium uppercase",
    },
    variants: {
        size: {
            small: {
                root: "w-7 h-7",
                fallback: "text-sm",
            },
            "2sm": {
                root: "w-[32px] h-[32px]",
                fallback: "text-sm",
            },
            medium: {
                root: "w-11 h-11",
                fallback: "text-md",
            },
            large: {
                root: "w-24 h-24",
                fallback: "text-lg",
            },
            xlarge: {
                root: "w-32 h-32",
                fallback: "text-xl",
            },
        },
        rounded: {
            full: {
                root: "rounded-full",
            },
            sm: {
                root: "rounded-lg",
            },
        },
        border: {
            wide: {
                root: "border-4 border-background",
            },
        },
    },
    defaultVariants: {
        size: "medium",
        rounded: "full",
    },
});

export type AvatarProps = {
    src?: string | null;
    fallback?: string;
    alt?: string;
    className?: string;
} & VariantProps<typeof avatar>;

export function Avatar({
    size,
    fallback,
    src,
    alt,
    border,
    rounded,
    ...props
}: AvatarProps) {
    const styles = avatar({ size, border, rounded });
    const fallbackText = useMemo(() => {
        const isSmall = size === "small" || size === "2sm";

        return fallback
            ?.split(/\s/)
            .map((v) => (v.length > 0 ? v.charAt(0) : ""))
            .join("")
            .slice(0, isSmall ? 1 : undefined);
    }, [fallback, size]);

    return (
        <AvatarBase.Root
            {...props}
            key={src}
            className={styles.root({ className: props.className })}
        >
            {src != null && (
                <AvatarBase.Image
                    alt={fallback ?? alt ?? "avatar"}
                    src={src}
                    className={styles.image()}
                />
            )}
            <AvatarBase.Fallback className={styles.fallback()} delayMs={0}>
                <p>{fallbackText}</p>
            </AvatarBase.Fallback>
        </AvatarBase.Root>
    );
}
