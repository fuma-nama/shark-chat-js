import { Serialize } from "shared/types";
import { User } from "db/schema";
import { Controller, useForm } from "react-hook-form";
import { trpc } from "@/utils/trpc";
import {
  UpdateProfileOptions,
  useUpdateProfileMutation,
} from "@/utils/hooks/mutations/update-profile";
import { ImagePicker } from "@/components/input/ImagePicker";
import { input } from "ui/components/input";
import { Button } from "ui/components/button";
import React from "react";
import { userBanners } from "shared/media/format";

export function UpdateProfile({
  profile,
  onCancel,
}: {
  profile: Serialize<User>;
  onCancel: () => void;
}) {
  const form = useForm<UpdateProfileOptions>({
    defaultValues: {
      name: profile.name,
    },
  });
  const utils = trpc.useUtils();
  const mutation = useUpdateProfileMutation();

  const onSave = form.handleSubmit((v) => {
    mutation.mutate(v, {
      onSuccess(data) {
        utils.account.get.setData(undefined, data);
        onCancel();
      },
    });
  });

  return (
    <form className="flex flex-col" onSubmit={onSave}>
      <Controller
        name="banner"
        control={form.control}
        render={({ field: { value, onChange, ...field } }) => (
          <ImagePicker
            input={{ id: "banner", ...field }}
            aspectRatio={4}
            previewClassName="-mx-4"
            value={value ?? userBanners.url([profile.id], profile.banner_hash)}
            onChange={onChange}
          />
        )}
      />
      <Controller
        name="avatar"
        control={form.control}
        render={({ field: { value, onChange, ...field } }) => (
          <ImagePicker
            input={{ id: "avatar", ...field }}
            previewClassName="size-[100px] border-4 border-popover rounded-xl overflow-hidden -mt-[50px]"
            value={value ?? profile.image}
            onChange={onChange}
          />
        )}
      />

      <fieldset className="mt-4">
        <label htmlFor="username" className="text-xs font-medium">
          Username
        </label>
        <input
          id="username"
          placeholder={profile.name}
          className={input()}
          required
          {...form.register("name")}
        />
      </fieldset>
      <div className="flex flex-row gap-3 mt-8">
        <Button color="primary" onClick={onSave} isLoading={mutation.isLoading}>
          Save Changes
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
