import React, { ReactNode } from "react";
import { Dialog } from "../system/dialog";
import { createGroupSchema } from "@/server/schema/group";
import { useMutationHelpers } from "@/utils/trpc/helpers";
import { updateGroupInfo } from "@/utils/hooks/mutations/update-group-info";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { ImagePicker } from "../input/ImagePicker";
import { Button } from "../system/button";
import { input } from "../system/input";
import { useMutation } from "@tanstack/react-query";

export default function CreateGroupModal({
    open,
    setOpen,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
}) {
    return (
        <Dialog
            title="Create Group"
            description="Give your chat group a beautiful name and icon"
            open={open}
            onOpenChange={setOpen}
        >
            <Content onClose={() => setOpen(false)} />
        </Dialog>
    );
}

const schema = createGroupSchema.extend({
    icon: z.string().optional(),
});

function Content({ onClose }: { onClose: () => void }) {
    const { register, control, handleSubmit } = useForm<z.infer<typeof schema>>(
        {
            resolver: zodResolver(schema),
            defaultValues: {
                icon: undefined,
                name: "",
            },
        }
    );

    const mutation = useCreateMutation(onClose);
    const onSubmit = handleSubmit((input) => mutation.mutate(input));

    return (
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
                <label
                    htmlFor="name"
                    className="text-sm font-medium text-primary-foreground"
                >
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
                <Button
                    type="submit"
                    color="primary"
                    isLoading={mutation.isLoading}
                >
                    Save
                </Button>
            </div>
        </form>
    );
}

function useCreateMutation(onClose: () => void) {
    const handlers = useMutationHelpers();
    const utils = handlers.utils;

    return useMutation(
        async ({ name, icon }: z.infer<typeof schema>) => {
            const data = await utils.client.group.create.mutate({ name });

            if (icon != null) {
                return await updateGroupInfo(utils, {
                    groupId: data.id,
                    icon,
                });
            }

            return data;
        },
        {
            onSuccess(data) {
                onClose();
                handlers.createGroup(data);
            },
        }
    );
}