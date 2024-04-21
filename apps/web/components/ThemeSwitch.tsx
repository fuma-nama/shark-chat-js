"use client";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectProps,
  SelectTrigger,
  SelectValue,
} from "ui/components/select";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useMemo } from "react";
import { useMounted } from "ui/hooks/use-mounted";

export type ThemeSwitchProps = Omit<SelectProps, "value" | "onValueChanged"> & {
  id?: string;
};

export function ThemeSwitch({ id, ...props }: ThemeSwitchProps) {
  const { theme, themes, setTheme } = useTheme();
  const options = useMemo(() => themes.map(getInfo), [themes]);
  const mounted = useMounted();

  if (!mounted) return <></>;

  return (
    <Select value={theme} onValueChange={(v) => setTheme(v)} {...props}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        {options.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            <div className="flex flex-row items-center">
              <div className="mr-2">{item.icon}</div>
              <p>{item.name}</p>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function getInfo(theme: string) {
  switch (theme) {
    case "light":
      return {
        name: "Light",
        icon: <SunIcon className="w-4" />,
        value: theme,
      };
    case "dark":
      return {
        name: "Dark",
        icon: <MoonIcon className="w-4" />,
        value: theme,
      };
    case "system":
      return {
        name: "System",
        icon: <MonitorIcon className="w-4" />,
        value: theme,
      };
    default:
      return { name: theme, icon: undefined, value: theme };
  }
}
