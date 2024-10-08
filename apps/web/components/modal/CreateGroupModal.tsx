"use client";
import { SimpleDialog } from "ui/components/dialog";
import { createGroupSchema } from "shared/schema/group";
import { updateGroupInfo } from "@/utils/hooks/mutations/update-group-info";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { ImagePicker } from "../input/ImagePicker";
import { Button } from "ui/components/button";
import { input } from "ui/components/input";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { usePageStore } from "@/utils/stores/page";

export default function CreateGroupModal() {
  const [modal, setModal] = usePageStore((s) => [s.modal, s.setModal]);

  return (
    <SimpleDialog
      title="Create Group"
      description="Give your chat group a beautiful name and icon"
      open={modal?.type === "create-group"}
      onOpenChange={(v) => {
        if (v)
          setModal({
            type: "create-group",
          });
        else setModal(undefined);
      }}
    >
      <Content onClose={() => setModal(undefined)} />
    </SimpleDialog>
  );
}

const schema = createGroupSchema.extend({
  icon: z.string().optional(),
});

function Content({ onClose }: { onClose: () => void }) {
  const { register, control, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      icon: undefined,
      name: "",
    },
  });

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
              previewClassName="mx-auto w-[120px] aspect-square flex flex-col gap-3 items-center rounded-full"
            />
          )}
        />
      </fieldset>
      <fieldset>
        <label htmlFor="name" className="text-xs font-medium">
          Name
          <span className="text-red-400 mx-1">*</span>
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
        <Button type="submit" color="primary" isLoading={mutation.isLoading}>
          Save
        </Button>
      </div>
    </form>
  );
}

function useCreateMutation(onClose: () => void) {
  const utils = trpc.useUtils();

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
      onSuccess() {
        onClose();
      },
    },
  );
}
