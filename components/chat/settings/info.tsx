import { ImagePicker } from "@/components/input/ImagePicker";
import { input } from "@/components/system/input";
import { Avatar } from "@/components/system/avatar";
import { Button } from "@/components/system/button";
import { label, text } from "@/components/system/text";
import { groupIcon } from "@/utils/media/format";
import { trpc } from "@/utils/trpc";
import { useUpdateGroupInfoMutation } from "@/utils/trpc/update-group-info";
import { Group } from "@prisma/client";
import { Serialize } from "@trpc/server/dist/shared/internal/serialize";
import clsx from "clsx";
import { useState } from "react";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateGroupSchema } from "@/server/schema/group";
import { useIsGroupAdmin } from "@/utils/trpc/is-group-admin";

export function Info({ group }: { group: number }) {
    const query = trpc.group.info.useQuery({ groupId: group });
    const isAdmin = useIsGroupAdmin({ groupId: group });
    const [edit, setEdit] = useState(false);

    if (query.data == null || isAdmin.loading) {
        return <></>;
    }

    if (edit)
        return (
            <EditGroupPanel
                group={query.data}
                onCancel={() => setEdit(false)}
            />
        );

    const info = query.data;
    return (
        <div className="flex flex-col gap-3">
            <Avatar
                size="large"
                src={
                    info.icon_hash != null
                        ? groupIcon.url([group], info.icon_hash)
                        : null
                }
                fallback={info.name}
            />
            <div>
                <h2 className="text-2xl font-bold">{info.name}</h2>
                {info.unique_name != null && (
                    <p className={text({ size: "sm", type: "secondary" })}>
                        @{info.unique_name}
                    </p>
                )}
            </div>
            {isAdmin.value && (
                <div className="flex flex-row gap-3">
                    <Button color="primary" onClick={() => setEdit(true)}>
                        Edit Info
                    </Button>
                </div>
            )}
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
    const { register, handleSubmit, control } = useForm<z.infer<typeof schema>>(
        {
            resolver: zodResolver(schema),
            defaultValues: {
                unique_name: group.unique_name ?? undefined,
                name: group.name,
                public: group.public,
                icon: undefined,
            },
        }
    );

    const mutation = useUpdateGroupInfoMutation();

    const default_icon =
        group.icon_hash != null
            ? groupIcon.url([group.id], group.icon_hash)
            : null;

    const onSave = handleSubmit((values) => {
        mutation.mutate(
            { groupId: group.id, ...values },
            {
                onSuccess(data, { groupId }) {
                    onCancel();
                },
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
                <div className="flex flex-row mt-3">
                    <div
                        className={clsx(
                            "rounded-l-md border-[1px] border-r-0 bg-light-50 border-accent-600 px-2 flex",
                            "dark:border-accent-900 dark:bg-dark-800"
                        )}
                    >
                        <p className="text-lg m-auto">@</p>
                    </div>
                    <input
                        id="unique_name"
                        className={input({ className: "rounded-l-none" })}
                        placeholder="Optional"
                        {...register("unique_name")}
                    />
                </div>
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
