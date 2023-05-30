import { useProfile } from "@/utils/use-profile";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { Fragment, ReactNode } from "react";
import { Avatar } from "../system/avatar";
import { useRouter } from "next/router";

export type BreadcrumbItem = {
    text: string | ReactNode;
    href: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    const { profile } = useProfile();
    const query = useRouter().query;

    return (
        <div className="flex flex-row gap-1 items-center">
            <Link
                href="/home"
                className="flex flex-row gap-1 items-center max-sm:hidden"
            >
                <Avatar
                    src={profile?.image}
                    fallback={profile?.name ?? undefined}
                    size="small"
                />
                <Separator />
            </Link>
            {items.map((item, i) => (
                <Fragment key={item.href}>
                    {i !== 0 && <Separator />}
                    <Link
                        href={{ pathname: item.href, query }}
                        className="font-semibold text-base"
                    >
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
