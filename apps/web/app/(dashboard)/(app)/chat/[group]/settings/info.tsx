import { ImagePicker, usePreview } from "@/components/input/ImagePicker";
import { input } from "ui/components/input";
import { Avatar } from "ui/components/avatar";
import { Button, button } from "ui/components/button";
import { groupBanners, groupIcon } from "shared/media/format";
import { useUpdateGroupInfoMutation } from "@/utils/hooks/mutations/update-group-info";
import { Group } from "db/schema";
import { Serialize } from "shared/types";
import React, { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateGroupSchema } from "shared/schema/group";
import { UniqueNameInput } from "@/components/input/UniqueNameInput";
import { SimpleDialog } from "ui/components/dialog";
import { Cropper, ReactCropperElement } from "react-cropper";
import Image from "next/image";
import { cloudinaryLoader } from "@/utils/cloudinary-loader";
import { EditIcon } from "lucide-react";

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
      {isAdmin ? <BannerEdit group={group} /> : <BannerView group={group} />}
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

export function BannerEdit({ group }: { group: Group }) {
  const [file, setFile] = useState<Blob>();
  const cropperRef = useRef<ReactCropperElement>(null);
  const preview = usePreview(file);

  const mutation = useUpdateGroupInfoMutation({
    onSuccess() {
      setFile(undefined);
    },
  });

  const onCrop = () => {
    const cropped = cropperRef.current?.cropper.getCroppedCanvas().toDataURL();

    if (cropped) {
      mutation.mutate({
        groupId: group.id,
        banner: cropped,
      });
    }
  };

  return (
    <>
      <SimpleDialog
        open={Boolean(file)}
        onOpenChange={(open) => setFile((prev) => (open ? prev : undefined))}
        title="Change Banner"
        description="Best at 1200x400."
      >
        {preview && (
          <Cropper src={preview} aspectRatio={3} guides ref={cropperRef} />
        )}
        <div className="flex flex-row gap-3 mt-4">
          <Button
            color="primary"
            type="button"
            isLoading={mutation.isLoading}
            onClick={onCrop}
          >
            Crop
          </Button>
          <Button type="button" onClick={() => setFile(undefined)}>
            Cancel
          </Button>
        </div>
      </SimpleDialog>

      <input
        id="banner_image"
        type="file"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0)
            setFile(e.target.files[0]);
        }}
        hidden
      />
      <div className="relative">
        <label
          htmlFor="banner_image"
          aria-label="Change Banner"
          className={button({
            size: "icon",
            className:
              "absolute z-[2] top-2 right-0 cursor-pointer rounded-full",
          })}
        >
          <EditIcon className="size-4" />
        </label>
        <BannerView group={group} />
      </div>
    </>
  );
}

function BannerView({ group }: { group: Group }) {
  if (group.banner_hash) {
    return (
      <div className="relative aspect-[3] bg-card overflow-hidden -mx-4 lg:rounded-lg">
        <Image
          priority
          alt="Banner"
          fill
          sizes="(max-width: 800px) 90vw, 800px"
          src={groupBanners.url([group.id], group.banner_hash)}
          loader={cloudinaryLoader}
        />
      </div>
    );
  }

  return (
    <div className="h-auto aspect-[3] bg-gradient-to-b from-brand to-brand-300 -mx-4 lg:rounded-lg" />
  );
}

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
      },
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
            previewClassName="size-[150px] max-w-full mx-auto"
          />
        )}
      />

      <fieldset>
        <label htmlFor="name" className="font-medium text-sm">
          Name
        </label>
        <input id="name" className={input()} {...register("name")} />
      </fieldset>
      <fieldset>
        <label htmlFor="unique_name" className="font-medium text-sm">
          Unique Name
        </label>
        <p className="text-sm text-muted-foreground mb-2">
          People can find a group by its unique name
        </p>
        <UniqueNameInput
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

      <div className="flex flex-row gap-3 pt-2">
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
