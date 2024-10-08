"use client";
import * as AvatarBase from "@radix-ui/react-avatar";
import { ComponentPropsWithoutRef, forwardRef, useMemo } from "react";
import { tv, VariantProps } from "tailwind-variants";

const avatar = tv({
  slots: {
    root: "relative inline-flex aspect-square overflow-hidden",
    fallback:
      "flex size-full text-center items-center justify-center bg-primary text-primary-foreground text-sm font-medium uppercase",
  },
  variants: {
    size: {
      small: {
        root: "w-7 h-7",
        fallback: "text-sm",
      },
      "2sm": {
        root: "size-8",
        fallback: "text-sm",
      },
      medium: {
        root: "size-10",
        fallback: "text-md",
      },
      large: {
        root: "size-24",
        fallback: "text-lg",
      },
      xlarge: {
        root: "size-32",
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
          className="size-full object-cover bg-brand"
        />
      )}
      <AvatarBase.Fallback className={styles.fallback()} delayMs={0}>
        <p>{fallbackText}</p>
      </AvatarBase.Fallback>
    </AvatarBase.Root>
  );
});

Avatar.displayName = "Avatar";
