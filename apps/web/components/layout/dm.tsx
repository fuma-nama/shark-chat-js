import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { AppLayout } from "./app";
import { ReactNode } from "react";
import { skeleton } from "ui/components/skeleton";
import { Avatar } from "ui/components/avatar";

export function useDirectMessageLayout({
    footer,
    children,
}: {
    footer: ReactNode;
    children: ReactNode;
}) {
    const router = useRouter();

    return (
        <AppLayout
            footer={footer}
            breadcrumb={[
                {
                    text: <BreadcrumbItem />,
                    href: router.asPath,
                },
            ]}
        >
            {children}
        </AppLayout>
    );
}

function BreadcrumbItem() {
    const { channel } = useRouter().query as { channel: string };
    const { status } = useSession();
    const query = trpc.dm.info.useQuery(
        { channelId: channel },
        { enabled: status === "authenticated" }
    );

    return query.data == null ? (
        <div className={skeleton()} />
    ) : (
        <div className="flex flex-row gap-2 items-center">
            <Avatar
                src={query.data.user.image}
                fallback={query.data.user.name}
                size="small"
            />
            <span>{query.data.user.name}</span>
        </div>
    );
}
