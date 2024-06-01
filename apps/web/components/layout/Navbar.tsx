"use client";
import { usePageStore } from "@/utils/stores/page";
import { SidebarOpen } from "lucide-react";
import { ReactNode } from "react";
import { BreadcrumbItemType, Breadcrumbs } from "./Breadcrumbs";
import { cn } from "ui/utils/cn";
import { button } from "ui/components/button";

export function Navbar({
  children,
  breadcrumb,
}: {
  breadcrumb: BreadcrumbItemType[];
  children?: ReactNode;
}) {
  const [setSidebarOpen] = usePageStore((v) => [v.setSidebarOpen]);

  //backdrop filter will break the `fixed` position in children elements
  return (
    <header className="sticky top-0 z-20 bg-background/50 before:backdrop-blur-lg before:absolute before:inset-0 before:-z-[1] before:w-full">
      <nav className="flex flex-row gap-2 px-4 py-2 mx-auto min-h-[52px]">
        <button
          className={cn(
            button({
              className: "md:hidden",
              color: "ghost",
              size: "icon",
            }),
          )}
          onClick={() => setSidebarOpen(true)}
        >
          <SidebarOpen className="size-5" />
        </button>
        <Breadcrumbs items={breadcrumb} />
        <div className="flex flex-row gap-2 items-center ml-auto">
          {children}
        </div>
      </nav>
    </header>
  );
}
