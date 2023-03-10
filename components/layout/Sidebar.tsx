import { usePageStore } from "@/stores/page";
import useProfile from "@/utils/auth/use-profile";
import {
    ChevronRightIcon,
    Cross1Icon,
    GearIcon,
    HomeIcon,
} from "@radix-ui/react-icons";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import Avatar from "../system/avatar";

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
                    "relative flex flex-col p-4 gap-1 bg-light-50 dark:bg-dark-800 overflow-y-auto",
                    "max-md:fixed max-md:left-0 max-md:top-0 max-md:w-full max-md:max-w-[20rem] max-md:min-h-screen max-md:z-50",
                    "max-md:transition-transform max-md:duration-500",
                    !isOpen && "max-md:-translate-x-full"
                )}
            >
                <button
                    className="p-2 rounded-lg bg-light-50 dark:bg-dark-800 absolute top-0 right-0 md:hidden"
                    onClick={onClose}
                >
                    <Cross1Icon className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center justify-center aspect-[5/2] bg-gradient-to-br from-brand-400 to-brand-500 rounded-xl text-5xl mb-4">
                    <p className="font-light text-white">Shark</p>
                </div>
                <Items />
                <div className="mt-auto" />
                <BottomCard />
            </aside>
        </>
    );
}

function Items() {
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
    const current = useRouter().route;

    return (
        <>
            {items.map(({ name, route, icon }) => (
                <Item
                    key={route}
                    active={current === route}
                    icon={icon}
                    route={route}
                >
                    {name}
                </Item>
            ))}
        </>
    );
}

function Item({
    active,
    children,
    icon,
    route,
}: {
    active: boolean;
    route: string;
    icon: ReactNode;
    children: string;
}) {
    return (
        <Link
            href={route}
            className={clsx(
                "rounded-xl -mx-2 p-2 flex flex-row gap-2 items-center",
                active && "bg-brand-200/20 dark:bg-brand-300/10"
            )}
        >
            <div
                className={clsx(
                    "rounded-xl p-1.5",
                    active &&
                        "bg-gradient-to-br from-brand-400 to-brand-500 text-accent-50",
                    !active &&
                        "text-brand-400 bg-brand-100/40 dark:text-brand-100 dark:bg-brand-400/30"
                )}
            >
                {icon}
            </div>
            <p
                className={clsx(
                    "text-base",
                    active && "text-brand-500 dark:text-white font-semibold",
                    !active && "text-accent-900 dark:text-accent-100"
                )}
            >
                {children}
            </p>
        </Link>
    );
}

function BottomCard() {
    const { status, profile } = useProfile();
    if (status !== "authenticated") return <></>;

    return (
        <Link
            href="/settings"
            className={clsx(
                "-mx-2 p-2 rounded-xl flex flex-row items-center group cursor-pointer",
                "hover:bg-brand-200/20 dark:hover:bg-brand-300/10 transition-colors"
            )}
        >
            <div className="flex flex-col flex-shrink-0 max-h-fit mr-3">
                <Avatar
                    src={profile.image ?? undefined}
                    fallback={profile.name ?? undefined}
                />
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
                <p className="font-semibold">{profile.name}</p>
                <p className="text-accent-800 dark:text-accent-600 text-sm text-ellipsis inline-block w-full break-keep overflow-hidden">
                    {profile.email}
                </p>
            </div>
            <ChevronRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform my-auto text-accent-800" />
        </Link>
    );
}
