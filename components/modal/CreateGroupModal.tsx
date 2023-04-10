import React, { ReactNode } from "react";
import { Dialog } from "../system/dialog";
import { createGroupSchema } from "@/server/schema/group";
import { useMutationHandlers } from "@/utils/handlers/trpc";
import { trpc } from "@/utils/trpc";
import { useUpdateGroupInfoMutation } from "@/utils/trpc/update-group-info";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { ImagePicker } from "../input/ImagePicker";
import { Button } from "../system/button";
import { input } from "../system/input";
import { label } from "../system/text";

export default function CreateGroupModal({
    children,
    open,
    setOpen,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    children?: ReactNode;
}) {
    return (
        <Dialog
            title="Create Group"
            description="Give your chat group a beautiful name and icon"
            open={open}
            onOpenChange={setOpen}
            trigger={children}
        >
            <Content onClose={() => setOpen(false)} />
        </Dialog>
    );
}

const schema = createGroupSchema.extend({
    icon: z.string().optional(),
});

function Content({ onClose }: { onClose: () => void }) {
    const handlers = useMutationHandlers();
    const { register, control, handleSubmit } = useForm<z.infer<typeof schema>>(
        {
            resolver: zodResolver(schema),
            defaultValues: {
                icon: undefined,
                name: "",
            },
        }
    );

    const updateMutation = useUpdateGroupInfoMutation();
    const create = trpc.group.create.useMutation();

    const isLoading = updateMutation.isLoading || create.isLoading;
    const onSubmit = handleSubmit(({ name, icon }) => {
        return create.mutate(
            {
                name,
            },
            {
                async onSuccess(data) {
                    const result = await updateMutation.mutateAsync({
                        groupId: data.id,
                        icon,
                    });

                    handlers.createGroup(result);
                    onClose();
                },
            }
        );
    });

    return (
        <>
            <form className="mt-8 space-y-2" onSubmit={onSubmit}>
                <fieldset>
                    <label htmlFor="icon" className="sr-only">
                        Icon
                    </label>
                    <Controller
                        control={control}
                        name="icon"
                        render={({ field: { value, onChange, ...field } }) => (
                            <ImagePicker
                                input={{ id: "icon", ...field }}
                                value={value ?? null}
                                onChange={onChange}
                                previewClassName="mx-auto w-[120px] aspect-square flex flex-col gap-3 items-center"
                            />
                        )}
                    />
                </fieldset>
                <fieldset>
                    <label htmlFor="name" className={label()}>
                        Name
                        <span className="text-red-400 mx-1 text-base">*</span>
                    </label>
                    <input
                        id="name"
                        placeholder="My Group"
                        autoComplete="off"
                        className={input()}
                        aria-required
                        {...register("name")}
                    />
                </fieldset>
                <div className="mt-4 flex justify-end">
                    <Button type="submit" color="primary" isLoading={isLoading}>
                        Save
                    </Button>
                </div>
            </form>
        </>
    );
}
