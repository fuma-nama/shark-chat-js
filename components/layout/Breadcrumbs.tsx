import { ChevronRightIcon } from "@radix-ui/react-icons";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Fragment, ReactNode } from "react";
import Avatar from "../Avatar";

export type BreadcrumbItem = {
    text: string | ReactNode;
    href: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    const user = useSession().data?.user;

    return (
        <div className="flex flex-row gap-1 items-center">
            <Link
                href="/home"
                className="flex flex-row gap-1 items-center max-sm:hidden"
            >
                <Avatar
                    alt="avatar"
                    src={user?.image ?? undefined}
                    fallback={user?.name ?? undefined}
                    variant="small"
                />
                <Separator />
            </Link>
            {items.map((item, i) => (
                <Fragment key={item.href}>
                    {i !== 0 && <Separator />}
                    <Link href={item.href} className="font-semibold text-sm">
                        {item.text}
                    </Link>
                </Fragment>
            ))}
        </div>
    );
}

function Separator() {
    return <ChevronRightIcon className="h-5 w-5 text-accent-800" />;
}
