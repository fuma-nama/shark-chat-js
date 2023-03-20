import { input } from "@/components/system/input";
import { createGroupSchema } from "@/server/schema/group";
import { trpc } from "@/utils/trpc";
import { useTrpcHandlers } from "@/utils/handlers/trpc";
import { useUpdateGroupInfoMutation } from "@/utils/trpc/update-group-info";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { ImagePicker } from "../../input/ImagePicker";
import { Button } from "../../system/button";
import { label } from "../../system/text";

const schema = createGroupSchema.extend({
    icon: z.string().optional(),
});

export default function Content({ onClose }: { onClose: () => void }) {
    const handlers = useTrpcHandlers();
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
                    <label htmlFor="firstName" className={label()}>
                        Name
                        <span className="text-red-400 mx-1 text-base">*</span>
                    </label>
                    <input
                        id="name"
                        placeholder="My Group"
                        autoComplete="given-name"
                        className={input()}
                        aria-required
                        {...register("name")}
                    />
                </fieldset>
                <div className="mt-4 flex justify-end">
                    <Button
                        type="submit"
                        color="primary"
                        isLoading={create.isLoading}
                    >
                        Save
                    </Button>
                </div>
            </form>
        </>
    );
}
