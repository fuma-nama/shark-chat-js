import { ImagePicker } from "@/components/input/ImagePicker";
import { input } from "ui/components/input";
import { Avatar } from "ui/components/avatar";
import { Button, button } from "ui/components/button";
import { groupIcon } from "shared/media/format";
import { useUpdateGroupInfoMutation } from "@/utils/hooks/mutations/update-group-info";
import { Group } from "db/schema";
import { Serialize } from "shared/types";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateGroupSchema } from "shared/schema/group";
import { UniqueNameInput } from "@/components/input/UniqueNameInput";
import { SimpleDialog } from "ui/components/dialog";

export default function Info({
  group,
  isAdmin,
}: {
  group: Group;
  isAdmin: boolean;
}) {
  const [edit, setEdit] = useState(false);

  return (
    <div className="flex flex-col">
      <div className="h-auto aspect-[3/1] xl:rounded-lg bg-gradient-to-b from-brand to-brand-300 -mx-4" />
      <div className="flex flex-col gap-3 -mt-[4rem]">
        <div className="w-full flex flex-row justify-between items-end">
          <Avatar
            size="xlarge"
            className="border-4 border-background"
            src={groupIcon.url([group.id], group.icon_hash)}
            fallback={group.name}
          />
          {isAdmin && (
            <div className="flex flex-row gap-3">
              <SimpleDialog
                open={edit}
                onOpenChange={setEdit}
                title="Edit Group"
                trigger={<button className={button()}>Edit Info</button>}
              >
                <EditGroupPanel group={group} onCancel={() => setEdit(false)} />
              </SimpleDialog>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold">{group.name}</h2>
          {group.unique_name != null && (
            <p className="text-sm text-muted-foreground">
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
  const { register, handleSubmit, control } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      unique_name: group.unique_name,
      name: group.name,
      icon: undefined,
    },
  });

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
            value={value ?? groupIcon.url([group.id], group.icon_hash)}
            onChange={onChange}
            previewClassName="size-[150px] max-w-full"
          />
        )}
      />

      <fieldset>
        <label htmlFor="name" className="font-medium text-foreground text-sm">
          Name
        </label>
        <input id="name" className={input()} {...register("name")} />
      </fieldset>
      <fieldset>
        <label
          htmlFor="unique_name"
          className="font-medium text-foreground text-sm"
        >
          Unique Name
        </label>
        <p className="text-sm text-muted-foreground">
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
        <p className="mt-1 text-xs text-muted-foreground">
          Only lower-case letters, numbers, underscore
        </p>
      </fieldset>

      <div className="flex flex-row gap-3">
        <Button type="submit" color="primary" isLoading={mutation.isLoading}>
          Save Changes
        </Button>
        <Button disabled={mutation.isLoading} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
