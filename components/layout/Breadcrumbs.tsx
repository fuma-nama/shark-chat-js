import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import Avatar from "../Avatar";
import { Sepator } from "./Navbar";

export function Breadcrumbs() {
    const user = useSession().data?.user;
    const router = useRouter();

    const breadcrumbs = useMemo(() => {
        const nodes = router.route.split("/").filter((v) => v.length > 0);

        return nodes.map((subpath, idx) => {
            const href = "/" + nodes.slice(0, idx + 1).join("/");
            return {
                href,
                text: subpath.slice(0, 1).toUpperCase() + subpath.slice(1),
            };
        });
    }, [router.route]);

    return (
        <div className="flex flex-row gap-1 items-center ">
            <Avatar
                alt="avatar"
                src={user?.image ?? undefined}
                fallback={user?.name ?? undefined}
                variant="small"
            />
            <Sepator />
            {breadcrumbs.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className="font-semibold text-sm"
                >
                    {item.text}
                </Link>
            ))}
        </div>
    );
}
