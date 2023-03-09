import * as AvatarBase from "@radix-ui/react-avatar";
import { AvatarIcon } from "@radix-ui/react-icons";
import { tv, VariantProps } from "tailwind-variants";

const avatar = tv({
    slots: {
        root: "relative inline-flex aspect-square",
        image: "h-full w-full object-cover rounded-full",
        fallback:
            "flex h-full w-full items-center justify-center bg-light dark:bg-dark-800",
    },
    variants: {
        size: {
            small: {
                root: "w-7 h-7",
            },
            medium: {
                root: "w-11 h-11",
            },
            large: {
                root: "w-24 h-24",
            },
        },
    },
    defaultVariants: {
        size: "medium",
    },
});

export type AvatarProps = {
    src?: string | null;
    alt?: string;
    fallback?: string;
} & VariantProps<typeof avatar>;

export default function Avatar({ size, ...props }: AvatarProps) {
    const styles = avatar({ size });

    return (
        <AvatarBase.Root className={styles.root()}>
            <AvatarBase.Image
                {...props}
                src={props.src ?? undefined}
                className={styles.image()}
            />
            <AvatarBase.Fallback className={styles.fallback()} delayMs={600}>
                <AvatarIcon className="text-sm font-medium uppercase text-accent-700 dark:text-accent-400" />
            </AvatarBase.Fallback>
        </AvatarBase.Root>
    );
}
