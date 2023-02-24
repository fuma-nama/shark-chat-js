import * as ContextMenu from "@radix-ui/react-context-menu";
import { ReactNode } from "react";
import { tv, VariantProps } from "tailwind-variants";

export const contextMenu = tv({
    slots: {
        content: [
            "bg-white shadow-xl shadow-brand-500/10 rounded-2xl p-1 py-2",
            "dark:bg-dark-900 dark:shadow-brand-700/50",
        ],
    },
});

export type MenuItemVariants = VariantProps<typeof menuItem>;
export const menuItem = tv({
    slots: {
        root: [
            "flex flex-row items-center gap-12 pl-6 pr-2 py-1 text-sm rounded-md cursor-pointer group",
            "radix-disabled:cursor-not-allowed radix-disabled:opacity-50",
        ],
        right: ["ml-auto text-accent-600 group-radix-highlighted:text-white"],
    },
    variants: {
        color: {
            secondary: {
                root: [
                    "text-accent-900",
                    "dark:text-accent-400",
                    "radix-highlighted:text-white radix-highlighted:bg-brand-500 radix-highlighted:outline-none",
                ],
            },
            danger: {
                root: [
                    "text-red-500",
                    "dark:text-red-400 dark:radix-highlighted:text-white",
                    "radix-highlighted:text-white radix-highlighted:bg-red-500 radix-highlighted:outline-none",
                ],
            },
        },
    },
    defaultVariants: {
        color: "secondary",
    },
});

export type RootProps = {
    trigger: ReactNode;
    children: ReactNode;
};

export function Root({ trigger, children }: RootProps) {
    const styles = contextMenu({});

    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger asChild>{trigger}</ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content className={styles.content()}>
                    {children}
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
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
            <p className="flex flex-row gap-1 items-center -ml-5">
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
            <p className="flex flex-row gap-1 items-center -ml-5">
                {icon} {children}
            </p>

            <div className={item.right()}>{shortcut}</div>
        </ContextMenu.CheckboxItem>
    );
}
