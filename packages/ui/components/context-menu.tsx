import * as ContextMenu from "@radix-ui/react-context-menu";
import { ReactNode } from "react";
import { tv, VariantProps } from "tailwind-variants";

export const contextMenu = tv({
    slots: {
        content:
            "bg-popover shadow-xl shadow-brand-500/10 rounded-2xl p-2 z-[100] dark:shadow-black/20",
    },
});

export type MenuItemVariants = VariantProps<typeof menuItem>;
export const menuItem = tv({
    slots: {
        root: [
            "flex flex-row items-center gap-12 pl-6 pr-2 py-1 rounded-md cursor-pointer transition-colors",
            "radix-disabled:cursor-not-allowed radix-disabled:opacity-50",
        ],
        label: "flex flex-row gap-2 items-center -ml-5",
        right: "ml-auto text-accent-600 group-radix-highlighted:text-white",
    },
    variants: {
        color: {
            secondary: {
                root: "radix-highlighted:text-accent-foreground radix-highlighted:bg-accent radix-highlighted:outline-none",
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
export type ContentProps = ContextMenu.ContextMenuContentProps;

export function Content(props: ContextMenu.ContextMenuContentProps) {
    const styles = contextMenu({});

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
    Pick<ContextMenu.MenuItemProps, "onClick" | "disabled"> & {
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

export type CheckboxItemProps = MenuItemProps & {
    value: boolean;
    onChange: (v: boolean) => void;
};

export function CheckboxItem({
    children,
    shortcut,
    icon,
    color,
    value,
    onChange,
    ...props
}: CheckboxItemProps) {
    const item = menuItem({ color });

    return (
        <ContextMenu.CheckboxItem
            {...props}
            className={item.root()}
            checked={value}
            onCheckedChange={(v) => onChange(v === true)}
        >
            <p className={item.label()}>
                {icon} {children}
            </p>

            <div className={item.right()}>{shortcut}</div>
        </ContextMenu.CheckboxItem>
    );
}
