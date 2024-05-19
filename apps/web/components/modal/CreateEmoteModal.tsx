"use client";
import { SimpleDialog } from "ui/components/dialog";
import { Button, button } from "ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { upload } from "@/utils/hooks/mutations/upload";
import { ImagePicker } from "@/components/input/ImagePicker";
import { fieldset, input } from "ui/components/input";
import { useState } from "react";
import { TRPCClientError } from "@trpc/client";

const schema = z.object({
  id: z.string().regex(/^\w+$/),
  name: z.string(),
  image: z.string(),
});

type Schema = z.infer<typeof schema>;

export function CreateEmoteModal() {
  const [open, setOpen] = useState(false);
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
  });

  const utils = trpc.useUtils();
  const mutation = useMutation(
    async (input: Schema) => {
      const sign = await utils.client.emotes.create.mutate({
        id: input.id,
        name: input.name,
      });

      await upload(sign, input.image);
    },
    {
      onSuccess() {
        void utils.emotes.get.invalidate();
        setOpen(false);
      },
      onError(e) {
        if (e instanceof TRPCClientError) {
          form.setError("id", {
            message: e.message,
          });
        }
      },
    },
  );

  const onSubmit = form.handleSubmit((v) => {
    mutation.mutate(v);
  });

  return (
    <SimpleDialog
      title="New Emote"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button className={button({ color: "primary" })}>Upload Emote</button>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Controller
          name="image"
          control={form.control}
          render={({ field: { value, onChange, ...field } }) => (
            <ImagePicker
              input={{ id: "icon", ...field }}
              value={value}
              onChange={onChange}
              previewClassName="size-[100px] max-w-full mx-auto"
            />
          )}
        />
        <fieldset className={fieldset().base()}>
          <label htmlFor="id" className={fieldset().label()}>
            ID
          </label>
          <p className={fieldset().description()}>
            The Id to use this emote, only A-Z and underscore are allowed.
          </p>
          <input
            id="id"
            className={input({ className: "mt-2" })}
            placeholder="shark_happy"
            {...form.register("id")}
          />
          {form.formState.errors.id && (
            <p className="text-red-400 text-xs">
              {form.formState.errors.id.message}
            </p>
          )}
        </fieldset>
        <fieldset className={fieldset().base()}>
          <label htmlFor="name" className={fieldset().label()}>
            Name
          </label>
          <input
            id="name"
            className={input()}
            placeholder="Shark Smile"
            {...form.register("name")}
          />
        </fieldset>
        <Button
          type="submit"
          isLoading={mutation.isLoading}
          className={button({ color: "primary" })}
        >
          Create
        </Button>
      </form>
    </SimpleDialog>
  );
}
