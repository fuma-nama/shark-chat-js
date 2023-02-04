import { signOut, useSession } from "next-auth/react";
import Avatar from "../Avatar";
import Button from "../Button";

export default function Sidebar() {
    return (
        <aside className="flex flex-col gap-3 bg-light-50 dark:bg-dark-800">
            <div className="mt-auto" />
            <BottomCard />
        </aside>
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
