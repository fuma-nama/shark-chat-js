"use client";
import * as AvatarBase from "@radix-ui/react-avatar";
import { ComponentPropsWithoutRef, forwardRef, useMemo } from "react";
import { tv, VariantProps } from "tailwind-variants";

const avatar = tv({
    slots: {
        root: "relative inline-flex aspect-square overflow-hidden",
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
} & VariantProps<typeof avatar> &
    ComponentPropsWithoutRef<"span">;

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>((props, ref) => {
    const { size, fallback, src, alt, rounded, ...rest } = props;
    const styles = avatar({ size, rounded });

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
            key={src}
            ref={ref}
            {...rest}
            className={styles.root({ className: rest.className })}
        >
            {src != null && (
                <AvatarBase.Image
                    alt={fallback ?? alt ?? "avatar"}
                    src={src}
                    className="h-full w-full object-cover"
                />
            )}
            <AvatarBase.Fallback className={styles.fallback()} delayMs={0}>
                <p>{fallbackText}</p>
            </AvatarBase.Fallback>
        </AvatarBase.Root>
    );
});

Avatar.displayName = "Avatar";
