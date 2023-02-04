import { Cross1Icon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { signOut, useSession } from "next-auth/react";
import Avatar from "../Avatar";
import Button from "../Button";

export default function Sidebar({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    return (
        <>
            {open && (
                <div
                    className="fixed w-full h-full bg-black/30 md:hidden animate-fade-in"
                    onClick={onClose}
                />
            )}
            <aside
                className={clsx(
                    "relative flex flex-col gap-3 bg-light-50 dark:bg-dark-800",
                    "max-md:fixed max-md:left-0 max-md:top-0 max-md:w-full max-md:max-w-[20rem] max-md:min-h-screen",
                    "max-md:transition-transform max-md:duration-500",
                    !open && "max-md:-translate-x-full"
                )}
            >
                <button
                    className="p-2 rounded-lg dark:bg-dark-700 absolute top-0 right-0 md:hidden"
                    onClick={onClose}
                >
                    <Cross1Icon className="w-5 h-5" />
                </button>
                <div className="mt-auto" />
                <BottomCard />
            </aside>
        </>
    );
}

function BottomCard() {
    const { status, data } = useSession();
    if (status === "unauthenticated" || status === "loading")
        return <Button>Login</Button>;

    return (
        <div className="p-4 rounded-xl">
            <Avatar
                src={data?.user?.image ?? undefined}
                fallback={data?.user?.name ?? undefined}
            />
            <p>{data?.user?.name}</p>
            <Button onClick={() => signOut()}>Logout</Button>
        </div>
    );
}
