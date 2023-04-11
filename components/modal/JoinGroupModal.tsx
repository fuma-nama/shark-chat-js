import { trpc } from "@/utils/trpc";
import { useMutationHandlers } from "@/utils/handlers/trpc";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../system/button";
import { Dialog } from "../system/dialog";
import { input } from "../system/input";
import { text } from "../system/text";
import * as Tabs from "@radix-ui/react-tabs";
import { tabs } from "../system/tabs";
import { UniqueNameInput } from "../input/UniqueNameInput";
import { zodResolver } from "@hookform/resolvers/zod";
import { uniqueNameSchema } from "@/server/schema/group";
import { z } from "zod";

export function JoinGroupModal({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const tabStyles = tabs();

    return (
        <Dialog
            title="Join Group"
            description="Chat with other peoples in the group"
            trigger={children}
            open={open}
            onOpenChange={setOpen}
        >
            <Tabs.Root
                defaultValue="code"
                className={tabStyles.root({ className: "mt-3" })}
            >
                <Tabs.List className={tabStyles.list()}>
                    <Tabs.TabsTrigger
                        value="code"
                        className={tabStyles.item()}
                        asChild
                    >
                        <label htmlFor="code">Invite Code</label>
                    </Tabs.TabsTrigger>
                    <Tabs.TabsTrigger
                        value="unique_name"
                        className={tabStyles.item()}
                        asChild
                    >
                        <label htmlFor="code">Unique Name</label>
                    </Tabs.TabsTrigger>
                </Tabs.List>
                <Tabs.Content value="code" className="focus:shadow-none">
                    <JoinGroupByCode onClose={() => setOpen(false)} />
                </Tabs.Content>
                <Tabs.Content value="unique_name" className="focus:shadow-none">
                    <JoinGroupByName onClose={() => setOpen(false)} />
                </Tabs.Content>
            </Tabs.Root>
        </Dialog>
    );
}

function JoinGroupByCode({ onClose }: { onClose: () => void }) {
    const handlers = useMutationHandlers();
    const { register, handleSubmit, formState, setError } = useForm<{
        code: string;
    }>({
        defaultValues: {
            code: "",
        },
    });

    const joinMutation = trpc.group.join.useMutation({
        onSuccess(data) {
            handlers.createGroup(data);
            onClose();
        },
        onError(e) {
            setError("code", { message: e.message, type: "value" });
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
                <input
                    id="code"
                    autoComplete="off"
                    className={input()}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx"
                    {...register("code", { minLength: 4 })}
                />
                <p className={text({ size: "xs", type: "error" })}>
                    {formState.errors?.code?.message}
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

const schema = z.object({
    unique_name: uniqueNameSchema,
});

function JoinGroupByName({ onClose }: { onClose: () => void }) {
    const handlers = useMutationHandlers();
    const { register, handleSubmit, formState, setError } = useForm<
        z.infer<typeof schema>
    >({
        resolver: zodResolver(schema),
        defaultValues: {
            unique_name: "",
        },
    });

    const joinMutation = trpc.group.joinByUniqueName.useMutation({
        onSuccess(data) {
            handlers.createGroup(data);
            onClose();
        },
        onError(e) {
            setError("unique_name", { message: e.message, type: "value" });
        },
    });

    const onJoin = handleSubmit(({ unique_name }) =>
        joinMutation.mutate({
            uniqueName: unique_name,
        })
    );

    return (
        <form onSubmit={onJoin}>
            <fieldset className="mt-3">
                <UniqueNameInput
                    input={{
                        id: "code",
                        autoComplete: "off",
                        placeholder: "my_group_name",
                        ...register("unique_name"),
                    }}
                />
                <p className={text({ size: "xs", type: "error" })}>
                    {formState.errors.unique_name?.message}
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
