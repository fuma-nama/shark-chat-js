"use client";
import { ImagePicker } from "@/components/input/ImagePicker";
import { input } from "ui/components/input";
import { Avatar } from "ui/components/avatar";
import { Button, button } from "ui/components/button";
import { groupBanners, groupIcon } from "shared/media/format";
import { useUpdateGroupInfoMutation } from "@/utils/hooks/mutations/update-group-info";
import { Group } from "db/schema";
import { Serialize } from "shared/types";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateGroupSchema } from "shared/schema/group";
import { UniqueNameInput } from "@/components/input/UniqueNameInput";
import { SimpleDialog } from "ui/components/dialog";
import { useGroupContext } from "@/utils/contexts/group-context";
import { useSession } from "@/utils/auth";
import { BannerImage } from "@/components/BannerImage";

export function Info() {
  const [edit, setEdit] = useState(false);
  const group = useGroupContext();
  const { data } = useSession();
  const canEdit = group.member.admin || group.owner_id === data?.user.id;

  return (
    <div className="flex flex-col bg-card px-4 pb-8 overflow-hidden max-sm:-mx-4 sm:rounded-xl">
      <BannerImage url={groupBanners.url([group.id], group.banner_hash)} />
      <div className="w-full flex flex-row justify-between items-end">
        <Avatar
          size="xlarge"
          className="border-4 border-background -mt-16"
          src={groupIcon.url([group.id], group.icon_hash)}
          fallback={group.name}
        />
        {canEdit && (
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

      <h2 className="text-xl font-bold mt-3">{group.name}</h2>
      {group.unique_name != null && (
        <p className="text-sm text-muted-foreground mt-1">
          @{group.unique_name}
        </p>
      )}
    </div>
  );
}

const schema = updateGroupSchema
  .omit({ groupId: true, icon_hash: true, banner_hash: true })
  .extend({
    banner: z.string().optional(),
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
  const { register, handleSubmit, control } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      unique_name: group.unique_name,
      name: group.name,
    },
  });

  const onSave = handleSubmit((values) => {
    mutation.mutate(
      { groupId: group.id, ...values },
      {
        onSuccess: onCancel,
      },
    );
  });

  return (
    <form className="flex flex-col" onSubmit={onSave}>
      <Controller
        name="banner"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <ImagePicker
            input={{ id: "banner", ...field }}
            value={value ?? groupBanners.url([group.id], group.banner_hash)}
            onChange={onChange}
            aspectRatio={3}
            previewClassName="-mx-4"
          />
        )}
      />

      <Controller
        name="icon"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <ImagePicker
            input={{ id: "icon", ...field }}
            value={value ?? groupIcon.url([group.id], group.icon_hash)}
            onChange={onChange}
            previewClassName="size-[120px] rounded-full mt-[-60px] border-4 border-popover"
          />
        )}
      />

      <fieldset className="mt-4">
        <label htmlFor="name" className="font-medium text-xs">
          Name
        </label>
        <input id="name" className={input()} {...register("name")} />
      </fieldset>
      <fieldset className="mt-4">
        <label htmlFor="unique_name" className="font-medium text-xs">
          Unique Name
        </label>
        <p className="text-xs text-muted-foreground">
          People can find a group by its unique name
        </p>
        <UniqueNameInput
          root={{ className: "mt-2" }}
          input={{
            id: "unique_name",
            placeholder: control._defaultValues.unique_name,
            ...register("unique_name"),
          }}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Only lower-case letters, numbers, underscore
        </p>
      </fieldset>

      <div className="flex flex-row gap-3 mt-6">
        <Button type="submit" color="primary" isLoading={mutation.isLoading}>
          Save Changes
        </Button>
        <Button type="button" disabled={mutation.isLoading} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
