import { usePageStore } from "@/utils/stores/page";
import { SidebarOpen } from "lucide-react";
import { ReactNode } from "react";
import { BreadcrumbItemType, Breadcrumbs } from "./Breadcrumbs";

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
    <div className="sticky top-0 z-10 bg-background/50 before:backdrop-blur-lg before:absolute before:inset-0 before:-z-[1] before:w-full">
      <div className="flex flex-row gap-2 max-w-screen-2xl px-4 py-2 mx-auto min-h-[52px]">
        <button className="mr-2 md:hidden" onClick={() => setSidebarOpen(true)}>
          <SidebarOpen className="w-6 h-6" />
        </button>
        <Breadcrumbs items={breadcrumb} />
        <div className="ml-auto" />
        <div className="flex flex-row gap-2 items-center">{children}</div>
      </div>
    </div>
  );
}
