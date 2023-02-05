import { ThemeSwitch } from "@/components/ThemeSwitch";
import { usePageStore } from "@/stores/page";
import { ChevronRightIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";

export function Navbar({
    title,
    children,
}: {
    title: string;
    children?: ReactNode;
}) {
    const [setSidebarOpen] = usePageStore((v) => [v.setSidebarOpen]);

    return (
        <div className="flex flex-row gap-2 mb-10">
            <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
                <HamburgerMenuIcon className="w-6 h-6" />
            </button>
            <Breadcrumbs />
            <div className="ml-auto" />
            <div className="flex flex-row gap-2 items-center max-md:hidden">
                {children}
            </div>
            <ThemeSwitch />
        </div>
    );
}

export function Sepator() {
    return <ChevronRightIcon className="h-5 w-5 text-accent-800" />;
}
