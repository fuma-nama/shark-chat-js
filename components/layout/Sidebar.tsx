import { usePageStore } from "@/utils/stores/page";
import useProfile from "@/utils/use-profile";
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
import { Avatar } from "../system/avatar";
import { tv } from "tailwind-variants";

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

export default function Sidebar({ children }: { children: ReactNode }) {
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
                    "relative flex flex-col p-4 pb-0 gap-1 bg-light-50 dark:bg-dark-800 overflow-x-hidden overflow-y-auto h-full",
                    "max-md:fixed max-md:left-0 max-md:top-0 max-md:w-full max-md:max-w-[20rem] max-md:z-50",
                    "max-md:transition-transform max-md:duration-300",
                    !isOpen && "max-md:-translate-x-full"
                )}
            >
                <button
                    className="p-2 rounded-lg bg-light-50 dark:bg-dark-800 absolute top-0 right-0 md:hidden"
                    onClick={onClose}
                >
                    <Cross1Icon className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center justify-center aspect-[5/2] bg-gradient-to-br from-brand-400 to-brand-500 rounded-xl text-5xl mb-4 flex-shrink-0">
                    <p className="font-light text-white">Shark</p>
                </div>
                <Items />
                {children}
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

    return (
        <>
            {items.map(({ name, route, icon }) => {
                const active = route === router.route;
                const styles = siderbarItem({ active });

                return (
                    <Link key={route} href={route} className={styles.root()}>
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
                        <p className={styles.text()}>{name}</p>
                    </Link>
                );
            })}
        </>
    );
}

function BottomCard() {
    const { status, profile } = useProfile();
    if (status !== "authenticated") return <></>;

    return (
        <div className="sticky bottom-0 bg-light-50 dark:bg-dark-800 mt-auto -mx-2 py-2">
            <Link
                href="/settings"
                className={clsx(
                    "p-2 rounded-xl flex flex-row items-center group cursor-pointer transition-colors",
                    "hover:bg-brand-200/20 dark:hover:bg-brand-300/10"
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
        </div>
    );
}
