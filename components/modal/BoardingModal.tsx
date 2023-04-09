import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { Dialog } from "../system/dialog";
import { useMounted } from "@/utils/use-mounted";
import { useState } from "react";
import { Button } from "../system/button";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function BoardingModal() {
    const [open, setOpen] = useState(true);
    const { status, data } = useSession();
    const mounted = useMounted();

    if (!mounted || status !== "authenticated") return <></>;

    return (
        <Dialog
            title="Welcome!"
            description="Start talking on Shark Chat!"
            open={open}
            onOpenChange={setOpen}
        >
            <div className="p-3 py-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 mt-4">
                <p className="text-white m-auto w-fit">
                    <ChatBubbleIcon className="inline w-11 h-11" />
                    <span className="ml-2 text-xl font-bold">
                        {data.user.name}
                    </span>
                </p>
            </div>
            <div className="flex flex-row gap-3 mt-4">
                <Link href="/home/create-group">
                    <Button color="primary">Create Group</Button>
                </Link>

                <Link href="/home">
                    <Button color="secondary">Explore</Button>
                </Link>
            </div>
        </Dialog>
    );
}
