import { usePageStore } from "@/utils/stores/page";
import { useProfile } from "@/utils/hooks/use-profile";
import {
    ChevronRightIcon,
    Cross1Icon,
    GearIcon,
    HomeIcon,
} from "@radix-ui/react-icons";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { Avatar } from "ui/components/avatar";
import { tv } from "tailwind-variants";
import { trpc } from "@/utils/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/components/tabs";
import { cn } from "ui/utils/cn";
import { groupIcon } from "shared/media/format";

export const siderbarItem = tv({
    slots: {
        root: "rounded-xl -mx-2 p-2 flex flex-row gap-2 items-center",
        text: "text-base",
    },
    variants: {
        active: {
            true: {
                root: "bg-brand-200/20 dark:bg-brand-300/10",
                text: "text-brand-500 dark:text-white font-semibold",
            },
            false: {
                text: "text-accent-900 dark:text-accent-100",
            },
        },
    },
});

export default function Sidebar() {
    const [isOpen, setOpen] = usePageStore((v) => [
        v.isSidebarOpen,
        v.setSidebarOpen,
    ]);
    const onClose = () => setOpen(false);

    return (
        <>
            {isOpen && (
                <div
                    className="fixed w-full h-full bg-black/30 md:hidden animate-fade-in z-50"
                    onClick={onClose}
                />
            )}
            <aside
                className={clsx(
                    "relative flex flex-col p-4 pb-0 gap-1 bg-background border-r-2 overflow-x-hidden overflow-y-auto h-full",
                    "max-md:fixed max-md:left-0 max-md:top-0 max-md:w-full max-md:max-w-[20rem] max-md:z-50",
                    "max-md:transition-transform max-md:duration-300",
                    !isOpen && "max-md:-translate-x-full"
                )}
            >
                <button
                    className="bg-background absolute p-1 top-4 right-4 md:hidden"
                    onClick={onClose}
                >
                    <Cross1Icon className="w-4 h-4" />
                </button>
                <Link href="/info" prefetch={false} className="font-bold mb-2">
                    Shark Chat
                </Link>
                <Items />
                <BottomCard />
            </aside>
        </>
    );
}

const items = [
    {
        name: "Home",
        route: "/home",
        icon: <HomeIcon className="w-5 h-5" />,
    },
    {
        name: "Settings",
        route: "/settings",
        icon: <GearIcon className="w-5 h-5" />,
    },
];

function Items() {
    const router = useRouter();
    const query = trpc.group.all.useQuery(undefined);
    const dm = trpc.dm.channels.useQuery(undefined);

    return (
        <>
            {items.map(({ name, route, icon }) => {
                const active = route === router.route;

                return (
                    <Link
                        key={route}
                        href={route}
                        className={cn(
                            "flex flex-row gap-3 items-center p-1 rounded-lg",
                            active && "bg-accent"
                        )}
                    >
                        <div
                            className={cn(
                                "rounded-lg p-1.5 border-[1px] shadow-lg",
                                active &&
                                    "border-transparent bg-gradient-to-br from-brand-400 to-brand-500 text-accent-50",
                                !active &&
                                    "text-secondary-foreground border-secondary"
                            )}
                        >
                            {icon}
                        </div>
                        <p
                            className={cn(
                                "text-sm text-foreground",
                                active ? "font-medium" : "text-muted-foreground"
                            )}
                        >
                            {name}
                        </p>
                    </Link>
                );
            })}
            <Tabs defaultValue="group" className="mt-2">
                <TabsList>
                    <TabsTrigger value="group">Group</TabsTrigger>
                    <TabsTrigger value="friend">User</TabsTrigger>
                </TabsList>
                <TabsContent value="group" className="flex flex-col gap-1">
                    {query.data?.map((group) => (
                        <SidebarItem
                            key={group.id}
                            href={`/chat/${group.id}`}
                            description={group.last_message?.content}
                            active={router.query.group === group.id.toString()}
                            image={groupIcon.url([group.id], group.icon_hash)}
                            notifications={group.unread_messages}
                        >
                            {group.name}
                        </SidebarItem>
                    ))}
                </TabsContent>
                <TabsContent value="friend">
                    {dm.data?.map((item) => (
                        <SidebarItem
                            key={item.id}
                            href={`/dm/${item.id}`}
                            active={router.query.channel === item.id}
                            image={item.user.image}
                            notifications={item.unread_messages}
                        >
                            {item.user.name}
                        </SidebarItem>
                    ))}
                </TabsContent>
            </Tabs>
        </>
    );
}

function SidebarItem({
    active,
    href,
    image,
    description,
    children: name,
    notifications,
}: {
    active: boolean;
    description?: string;
    href: string;
    image: string | null;
    children: string;
    notifications: number;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "flex flex-row items-center gap-2 p-1 rounded-lg text-sm",
                active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
            )}
        >
            <Avatar src={image} fallback={name} size="2sm" rounded="sm" />
            <div>
                <p className="font-medium">{name}</p>
                <p className="text-muted-foreground text-xs">{description}</p>
            </div>
            {notifications > 0 && (
                <div className="text-primary-foreground bg-primary text-xs rounded-full px-1.5 py-0.5 ml-auto">
                    {notifications}
                </div>
            )}
        </Link>
    );
}

function BottomCard() {
    const { status, profile } = useProfile();
    if (status !== "authenticated") return <></>;

    return (
        <div className="sticky bottom-0 bg-background mt-auto -mx-2 py-2">
            <Link
                href="/settings"
                className={clsx(
                    "p-2 rounded-xl flex flex-row items-center group cursor-pointer transition-colors",
                    "hover:bg-accent"
                )}
            >
                <div className="flex flex-col flex-shrink-0 max-h-fit mr-3">
                    <Avatar
                        src={profile.image ?? undefined}
                        fallback={profile.name ?? undefined}
                        size="2sm"
                    />
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                    <p className="font-semibold text-sm">{profile.name}</p>
                    <p className="text-muted-foreground text-xs">
                        View Profile
                    </p>
                </div>
                <ChevronRightIcon className="w-4 h-4 my-auto text-muted-foreground" />
            </Link>
        </div>
    );
}
