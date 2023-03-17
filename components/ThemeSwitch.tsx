import { useTheme } from "next-themes";
import * as Select from "@radix-ui/react-select";
import {
    CheckIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    Half2Icon,
    MoonIcon,
    SunIcon,
} from "@radix-ui/react-icons";
import { Button } from "./system/button";
import clsx from "clsx";
import { useMemo } from "react";
import { useMounted } from "@/utils/use-mounted";

export type ThemeSwitchProps = Omit<
    Select.SelectProps,
    "value" | "onValueChanged"
> & {
    id?: string;
};

export function ThemeSwitch({ id, ...props }: ThemeSwitchProps) {
    const { theme, themes, setTheme } = useTheme();
    const options = useMemo(() => themes.map(getInfo), [themes]);
    const mounted = useMounted();

    if (!mounted) return <></>;

    const selected = theme == null ? null : getInfo(theme);

    return (
        <Select.Root
            value={theme}
            onValueChange={(v) => setTheme(v)}
            {...props}
        >
            <Select.Trigger asChild aria-label="Theme" id={id}>
                <Button>
                    <Select.Icon className="mr-2">{selected?.icon}</Select.Icon>
                    <Select.Value />
                    <Select.Icon className="ml-2">
                        <ChevronDownIcon />
                    </Select.Icon>
                </Button>
            </Select.Trigger>
            <Select.Content>
                <Select.ScrollUpButton className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                    <ChevronUpIcon />
                </Select.ScrollUpButton>
                <Select.Viewport className="bg-white p-2 rounded-lg shadow-lg shadow-brand-500/10 dark:shadow-none dark:bg-dark-800">
                    <Select.Group>
                        {options.map((item) => (
                            <Select.Item
                                key={item.value}
                                value={item.value}
                                className={clsx(
                                    "relative flex items-center pr-8 p-2 rounded-md text-sm text-gray-700 dark:text-accent-50 font-medium focus:bg-light-100 dark:focus:bg-dark-700",
                                    "radix-disabled:opacity-50 dark:radix-state-checked:bg-brand-400",
                                    "focus:outline-none select-none cursor-pointer"
                                )}
                            >
                                <div className="mr-2">{item.icon}</div>
                                <Select.ItemText>{item.name}</Select.ItemText>
                                <Select.ItemIndicator className="absolute right-2 inline-flex items-center">
                                    <CheckIcon />
                                </Select.ItemIndicator>
                            </Select.Item>
                        ))}
                    </Select.Group>
                </Select.Viewport>
                <Select.ScrollDownButton className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                    <ChevronDownIcon />
                </Select.ScrollDownButton>
            </Select.Content>
        </Select.Root>
    );
}

function getInfo(theme: string) {
    switch (theme) {
        case "light":
            return { name: "Light", icon: <SunIcon />, value: theme };
        case "dark":
            return { name: "Dark", icon: <MoonIcon />, value: theme };
        case "system":
            return { name: "System", icon: <Half2Icon />, value: theme };
        default:
            return { name: theme, icon: undefined, value: theme };
    }
}
