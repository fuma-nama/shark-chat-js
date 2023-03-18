import { ImagePicker } from "@/components/input/ImagePicker";
import TextField from "@/components/input/TextField";
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

export function Info({ group }: { group: number }) {
    const query = trpc.group.info.useQuery({ groupId: group });
    const [edit, setEdit] = useState(false);

    if (query.data == null) {
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
                <p className={text({ size: "sm", type: "secondary" })}>
                    @{info.unique_name ?? "no_name_yet"}
                </p>
            </div>
            <div className="flex flex-row gap-3">
                <Button color="primary" onClick={() => setEdit(true)}>
                    Edit Info
                </Button>
            </div>
        </div>
    );
}

function EditGroupPanel({
    group,
    onCancel,
}: {
    group: Serialize<Group>;
    onCancel: () => void;
}) {
    const [name, setName] = useState(group.name);
    const [uniqueName, setUniqueName] = useState(group.unique_name ?? "");
    const [icon, setIcon] = useState<string | undefined>(undefined);
    const utils = trpc.useContext();
    const mutation = useUpdateGroupInfoMutation();

    const default_icon =
        group.icon_hash != null
            ? groupIcon.url([group.id], group.icon_hash)
            : null;

    const onSave = () => {
        mutation.mutate(
            { groupId: group.id, icon, name, unique_name: uniqueName },
            {
                onSuccess(data) {
                    utils.group.info.setData({ groupId: data.id }, () => data);
                    onCancel();
                },
            }
        );
    };

    return (
        <form
            className="flex flex-col gap-3 items-start"
            onSubmit={(e) => {
                onSave();
                e.preventDefault();
            }}
        >
            <ImagePicker
                id="icon"
                value={icon ?? default_icon}
                onChange={setIcon}
                previewClassName="w-[150px] h-[150px] max-w-full"
            />
            <fieldset className="w-full max-w-xl">
                <label htmlFor="name" className={label()}>
                    Name
                </label>
                <TextField
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </fieldset>
            <fieldset className="w-full max-w-xl">
                <label htmlFor="unique_name" className={label()}>
                    Unique Name
                </label>
                <div className="flex flex-row mt-1">
                    <div
                        className={clsx(
                            "rounded-l-md border-[1px] border-r-0 bg-light-50 border-accent-600 px-2 flex",
                            "dark:border-accent-900 dark:bg-dark-800"
                        )}
                    >
                        <p className="text-lg m-auto">@</p>
                    </div>
                    <TextField
                        id="unique_name"
                        value={uniqueName}
                        onChange={(e) => setUniqueName(e.target.value)}
                        className="rounded-l-none"
                        placeholder="Optional"
                    />
                </div>
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
