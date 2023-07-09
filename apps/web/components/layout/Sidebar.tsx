import { usePageStore } from "@/utils/stores/page";
import { useProfile } from "@/utils/hooks/use-profile";
import { ChevronRightIcon, XIcon, SettingsIcon, HomeIcon } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { Avatar } from "ui/components/avatar";
import { trpc } from "@/utils/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/components/tabs";
import { cn } from "ui/utils/cn";
import { groupIcon } from "shared/media/format";
import { DirectMessageContextMenu } from "../menu/DirectMessageMenu";
import { ReactNode } from "react";

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
                    "sticky top-0 flex flex-col p-4 pb-0 gap-1 bg-gradient-to-b from-card to-background border-r-2 overflow-x-hidden overflow-y-auto md:h-screen",
                    "max-md:fixed max-md:bottom-0 max-md:left-0 max-md:top-0 max-md:w-full max-md:max-w-[20rem] max-md:z-50",
                    "max-md:transition-transform max-md:duration-300",
                    !isOpen && "max-md:-translate-x-full"
                )}
            >
                <button
                    className="bg-background absolute p-1 top-4 right-4 md:hidden"
                    onClick={onClose}
                >
                    <XIcon className="w-4 h-4" />
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

function Items() {
    const router = useRouter();
    const query = trpc.group.all.useQuery(undefined, { enabled: false });
    const dm = trpc.dm.channels.useQuery(undefined, { enabled: false });

    return (
        <>
            <LinkItem
                name="Home"
                route="/home"
                icon={<HomeIcon className="w-4 h-4" />}
            />
            <LinkItem
                name="Settings"
                route="/settings"
                icon={<SettingsIcon className="w-4 h-4" />}
            />
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
                        <DirectMessageContextMenu
                            key={item.id}
                            channelId={item.id}
                        >
                            <div>
                                <SidebarItem
                                    href={`/dm/${item.id}`}
                                    description={item.last_message?.content}
                                    active={router.query.channel === item.id}
                                    image={item.user.image}
                                    notifications={item.unread_messages}
                                >
                                    {item.user.name}
                                </SidebarItem>
                            </div>
                        </DirectMessageContextMenu>
                    ))}
                </TabsContent>
            </Tabs>
        </>
    );
}

function LinkItem({
    icon,
    name,
    route,
}: {
    name: string;
    route: string;
    icon: ReactNode;
}) {
    const active = route === useRouter().route;

    return (
        <Link
            href={route}
            className={cn(
                "flex flex-row gap-3 items-center p-1 rounded-lg",
                active ? "bg-accent" : "hover:bg-accent/50 transition-colors"
            )}
        >
            <div
                className={cn(
                    "rounded-lg p-2 border border-foreground/50 shadow-lg",
                    active &&
                        "border-transparent bg-gradient-to-br from-brand-400 to-brand-500 text-accent-50",
                    !active && "text-secondary-foreground"
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
            scroll={false}
            className={cn(
                "flex flex-row items-center gap-2 p-1 rounded-lg text-sm transition-colors",
                active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50"
            )}
        >
            <Avatar src={image} fallback={name} size="2sm" rounded="sm" />
            <div className="w-0 flex-1">
                <p className="font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                    {name}
                </p>
                <p className="text-muted-foreground text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                    {description}
                </p>
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
