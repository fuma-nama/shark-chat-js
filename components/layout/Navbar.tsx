import { usePageStore } from "@/utils/stores/page";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/router";
import { ReactNode, useMemo } from "react";
import { BreadcrumbItem, Breadcrumbs } from "./Breadcrumbs";

export function Navbar({
    children,
    ...props
}: {
    title: string;
    breadcrumb?: BreadcrumbItem[];
    children?: ReactNode;
}) {
    const router = useRouter();
    const breadcrumb = useMemo(() => {
        if (props.breadcrumb != null) return props.breadcrumb;

        const nodes = router.route.split("/").filter((v) => v.length > 0);

        return nodes.map((subpath, idx) => {
            const href = "/" + nodes.slice(0, idx + 1).join("/");
            return {
                href,
                text: subpath.slice(0, 1).toUpperCase() + subpath.slice(1),
            };
        });
    }, [props.breadcrumb, router.route]);
    const [setSidebarOpen] = usePageStore((v) => [v.setSidebarOpen]);

    return (
        <div className="sticky top-0 bg-light-100 dark:bg-dark-900 z-10 py-2 flex flex-row gap-2 mb-8 min-h-[52px]">
            <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
                <HamburgerMenuIcon className="w-6 h-6" />
            </button>
            <Breadcrumbs items={breadcrumb} />
            <div className="ml-auto" />
            <div className="flex flex-row gap-2 items-center">{children}</div>
        </div>
    );
}
