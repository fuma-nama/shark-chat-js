import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { SimpleDialog } from "ui/components/dialog";
import { useMounted } from "ui/hooks/use-mounted";
import { useState } from "react";
import { Button } from "ui/components/button";
import { useSession } from "next-auth/react";

export default function BoardingModal({
    onCreateGroup,
}: {
    onCreateGroup: () => void;
}) {
    const [open, setOpen] = useState(true);
    const { status, data } = useSession();
    const mounted = useMounted();

    if (!mounted || status !== "authenticated") return <></>;

    return (
        <SimpleDialog
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
                <Button color="primary" onClick={onCreateGroup}>
                    Create Group
                </Button>

                <Button color="secondary" onClick={() => setOpen(false)}>
                    Explore
                </Button>
            </div>
        </SimpleDialog>
    );
}
