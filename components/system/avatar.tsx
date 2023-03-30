import * as AvatarBase from "@radix-ui/react-avatar";
import { ReactNode, useMemo } from "react";
import { tv, VariantProps } from "tailwind-variants";

const avatar = tv({
    slots: {
        root: "relative inline-flex aspect-square",
        image: "h-full w-full object-cover rounded-full",
        fallback: [
            "flex h-full w-full text-center items-center justify-center bg-brand-500 text-sm font-medium uppercase rounded-full",
            "text-accent-50 dark:bg-brand-400",
        ],
    },
    variants: {
        size: {
            small: {
                root: "w-7 h-7",
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
        border: {
            wide: {
                image: "border-4 border-light-100 dark:border-dark-900",
            },
        },
    },
    defaultVariants: {
        size: "medium",
    },
});

export type AvatarProps = {
    src?: string | null;
    fallback?: string;
    alt?: string;
    asImage?: ReactNode;
} & VariantProps<typeof avatar>;

export function Avatar({
    size,
    fallback,
    asImage,
    src,
    alt,
    border,
}: AvatarProps) {
    const styles = avatar({ size, border });
    const fallbackText = useMemo(() => {
        return fallback
            ?.split(/\s/)
            .map((v) => (v.length > 0 ? v.charAt(0) : ""))
            .join("");
    }, [fallback]);

    return (
        <AvatarBase.Root className={styles.root()}>
            {src != null && (
                <AvatarBase.Image
                    alt={fallback ?? alt ?? "avatar"}
                    src={src}
                    className={styles.image()}
                    asChild={asImage != null}
                >
                    {asImage}
                </AvatarBase.Image>
            )}
            <AvatarBase.Fallback
                className={styles.fallback()}
                delayMs={src != null ? 200 : 0}
            >
                <p>{fallbackText}</p>
            </AvatarBase.Fallback>
        </AvatarBase.Root>
    );
}
