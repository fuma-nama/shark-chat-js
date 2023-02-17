import { ChevronRightIcon } from "@radix-ui/react-icons";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Avatar from "../Avatar";

export type BreadcrumbItem = {
    text: string;
    href: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    const user = useSession().data?.user;

    return (
        <div className="flex flex-row gap-1 items-center ">
            <Link href="/home">
                <Avatar
                    alt="avatar"
                    src={user?.image ?? undefined}
                    fallback={user?.name ?? undefined}
                    variant="small"
                />
            </Link>
            {items.map((item) => (
                <>
                    <Separator />
                    <Link
                        key={item.href}
                        href={item.href}
                        className="font-semibold text-sm"
                    >
                        {item.text}
                    </Link>
                </>
            ))}
        </div>
    );
}

function Separator() {
    return <ChevronRightIcon className="h-5 w-5 text-accent-800" />;
}
