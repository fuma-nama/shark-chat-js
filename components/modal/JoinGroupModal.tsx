import { trpc } from "@/utils/trpc";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../system/button";
import { Dialog } from "../system/dialog";
import { input } from "../system/input";
import { label, text } from "../system/text";

export function JoinGroupModal({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog
            title="Join Group"
            description="Chat with other peoples in the group"
            trigger={children}
            open={open}
            onOpenChange={setOpen}
        >
            <JoinGroup onClose={() => setOpen(false)} />
        </Dialog>
    );
}

function JoinGroup({ onClose }: { onClose: () => void }) {
    const utils = trpc.useContext();

    const { register, handleSubmit } = useForm<{ code: string }>({
        defaultValues: {
            code: "",
        },
    });
    const joinMutation = trpc.group.join.useMutation({
        onSuccess: (data) => {
            utils.group.info.setData({ groupId: data.id }, data);
            onClose();
        },
    });

    const onJoin = handleSubmit(({ code }) =>
        joinMutation.mutate({
            code,
        })
    );

    return (
        <form onSubmit={onJoin}>
            <fieldset className="mt-3">
                <label htmlFor="code" className={label()}>
                    Invite code
                </label>
                <input
                    id="code"
                    className={input()}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx"
                    {...register("code")}
                />
                <p className={text({ size: "xs", type: "error" })}>
                    {joinMutation.error?.message}
                </p>
            </fieldset>
            <Button
                type="submit"
                color="primary"
                className="mt-6 w-full"
                isLoading={joinMutation.isLoading}
            >
                Join
            </Button>
        </form>
    );
}
