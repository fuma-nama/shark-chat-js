import { ImagePicker } from "@/components/input/ImagePicker";
import TextField from "@/components/input/TextField";
import { Button } from "@/components/system/button";
import { groupIcon } from "@/utils/media/format";
import { trpc } from "@/utils/trpc";
import { useUpdateGroupInfoMutation } from "@/utils/trpc/update-group-info";
import { Group } from "@prisma/client";
import { Serialize } from "@trpc/server/dist/shared/internal/serialize";
import { useState } from "react";

export function EditGroupPanel({
    group,
    onCancel,
}: {
    group: Serialize<Group>;
    onCancel: () => void;
}) {
    const [name, setName] = useState(group.name);
    const [icon, setIcon] = useState<string | undefined>(undefined);
    const utils = trpc.useContext();
    const mutation = useUpdateGroupInfoMutation();

    const default_icon =
        group.icon_hash != null
            ? groupIcon.url([group.id], group.icon_hash)
            : null;

    const onSave = () => {
        mutation.mutate(
            { groupId: group.id, icon, name },
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
            <TextField
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
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
