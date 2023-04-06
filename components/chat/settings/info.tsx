import { ImagePicker } from "@/components/input/ImagePicker";
import { input } from "@/components/system/input";
import { Avatar } from "@/components/system/avatar";
import { Button } from "@/components/system/button";
import { label, text } from "@/components/system/text";
import { groupIcon } from "@/utils/media/format";
import { useUpdateGroupInfoMutation } from "@/utils/trpc/update-group-info";
import { Group } from "@prisma/client";
import { Serialize } from "@trpc/server/dist/shared/internal/serialize";
import { useState } from "react";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateGroupSchema } from "@/server/schema/group";
import { UniqueNameInput } from "@/components/input/UniqueNameInput";

export default function Info({
    group,
    isAdmin,
}: {
    group: Group;
    isAdmin: boolean;
}) {
    const [edit, setEdit] = useState(false);

    if (edit)
        return <EditGroupPanel group={group} onCancel={() => setEdit(false)} />;

    return (
        <div className="flex flex-col">
            <div className="h-auto aspect-[3/1] xl:rounded-lg bg-brand-500 dark:bg-brand-400 -mx-4" />
            <div className="flex flex-col gap-3 -mt-[4rem]">
                <div className="w-full flex flex-row justify-between items-end">
                    <Avatar
                        border="wide"
                        size="xlarge"
                        src={
                            group.icon_hash != null
                                ? groupIcon.url([group.id], group.icon_hash)
                                : null
                        }
                        fallback={group.name}
                    />
                    {isAdmin && (
                        <div className="flex flex-row gap-3">
                            <Button
                                color="primary"
                                onClick={() => setEdit(true)}
                            >
                                Edit Info
                            </Button>
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="text-2xl font-bold">{group.name}</h2>
                    {group.unique_name != null && (
                        <p className={text({ size: "sm", type: "secondary" })}>
                            @{group.unique_name}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

const schema = updateGroupSchema
    .omit({ groupId: true, icon_hash: true })
    .extend({
        icon: z.string().optional(),
    });

function EditGroupPanel({
    group,
    onCancel,
}: {
    group: Serialize<Group>;
    onCancel: () => void;
}) {
    const mutation = useUpdateGroupInfoMutation();
    const { register, handleSubmit, control } = useForm<z.infer<typeof schema>>(
        {
            resolver: zodResolver(schema),
            defaultValues: {
                unique_name: group.unique_name,
                name: group.name,
                public: group.public,
                icon: undefined,
            },
        }
    );

    const default_icon =
        group.icon_hash != null
            ? groupIcon.url([group.id], group.icon_hash)
            : null;

    const onSave = handleSubmit((values) => {
        mutation.mutate(
            { groupId: group.id, ...values },
            {
                onSuccess: onCancel,
            }
        );
    });

    return (
        <form className="flex flex-col gap-3" onSubmit={onSave}>
            <Controller
                name="icon"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                    <ImagePicker
                        input={{ id: "icon", ...field }}
                        value={value ?? default_icon}
                        onChange={onChange}
                        previewClassName="w-[150px] h-[150px] max-w-full"
                    />
                )}
            />

            <fieldset>
                <label htmlFor="name" className={label()}>
                    Name
                </label>
                <input id="name" className={input()} {...register("name")} />
            </fieldset>
            <fieldset>
                <label htmlFor="unique_name" className={label()}>
                    Unique Name
                </label>
                <p
                    className={text({
                        size: "sm",
                        type: "secondary",
                    })}
                >
                    People can find a group by its unique name
                </p>
                <UniqueNameInput
                    root={{ className: "mt-3" }}
                    input={{
                        id: "unique_name",
                        placeholder: control._defaultValues.unique_name,
                        ...register("unique_name"),
                    }}
                />
                <p
                    className={text({
                        size: "xs",
                        type: "secondary",
                        className: "mt-1",
                    })}
                >
                    Only lower-case letters, numbers, underscore
                </p>
            </fieldset>

            <div className="flex flex-row gap-3">
                <Button
                    type="submit"
                    color="primary"
                    isLoading={mutation.isLoading}
                >
                    Save Changes
                </Button>
                <Button disabled={mutation.isLoading} onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
