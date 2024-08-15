import * as ContextMenu from "@radix-ui/react-context-menu";
import { ReactNode } from "react";
import { tv, VariantProps } from "tailwind-variants";

export const contextMenu = tv({
  slots: {
    content:
      "bg-popover shadow-lg border text-popover-foreground text-sm rounded-lg p-1 z-10",
  },
});

export type MenuItemVariants = VariantProps<typeof menuItem>;
export const menuItem = tv({
  slots: {
    root: [
      "flex flex-row items-center gap-12 px-3 py-1 rounded-md cursor-pointer radix-disabled:cursor-not-allowed radix-disabled:opacity-50",
    ],
    label: "flex flex-row gap-2 items-center",
    right: "ml-auto text-muted-foreground group-radix-highlighted:text-white",
  },
  variants: {
    color: {
      secondary: {
        root: "radix-highlighted:text-primary-foreground radix-highlighted:bg-primary radix-highlighted:outline-none",
      },
      danger: {
        root: [
          "text-destructive",
          "radix-highlighted:text-destructive-foreground radix-highlighted:bg-destructive radix-highlighted:outline-none",
        ],
      },
    },
  },
  defaultVariants: {
    color: "secondary",
  },
});

export const Root = ContextMenu.Root;
export const Trigger = ContextMenu.Trigger;

export function Content(props: ContextMenu.ContextMenuContentProps) {
  const styles = contextMenu();

  return (
    <ContextMenu.Portal>
      <ContextMenu.Content
        {...props}
        className={styles.content({ className: props.className })}
      />
    </ContextMenu.Portal>
  );
}

export type MenuItemProps = MenuItemVariants &
  Pick<
    ContextMenu.ContextMenuItemProps,
    "onClick" | "onSelect" | "disabled"
  > & {
    children: ReactNode;
    shortcut?: string;
    icon?: ReactNode;
  };

export function Item({
  children,
  shortcut,
  icon,
  color,
  ...props
}: MenuItemProps) {
  const item = menuItem({ color });

  return (
    <ContextMenu.Item {...props} className={item.root()}>
      <p className={item.label()}>
        {icon} {children}
      </p>

      <div className={item.right()}>{shortcut}</div>
    </ContextMenu.Item>
  );
}
