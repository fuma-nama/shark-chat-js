/* eslint-disable @next/next/no-img-element */
import React, { ComponentProps, useEffect, useRef, useState } from "react";
import { Button } from "ui/components/button";
import { Cropper, ReactCropperElement } from "react-cropper";
import { SimpleDialog } from "ui/components/dialog";
import { useCallbackRef } from "@/utils/hooks/use-callback-ref";
import { cn } from "ui/utils/cn";

export function ImagePicker({
  value,
  onChange,
  previewClassName,
  aspectRatio = 1,
  input,
}: {
  value: string | null;
  onChange: (v: string) => void;
  previewClassName?: string;
  aspectRatio?: number;
  input?: ComponentProps<"input">;
}) {
  const [selected, setSelected] = useState<File | null>();
  const [edit, setEdit] = useState(false);
  const preview = usePreview(selected);
  const cropperRef = useRef<ReactCropperElement>(null);
  const id = input?.id ?? "image-upload";

  const onCrop = useCallbackRef(() => {
    const cropped = cropperRef.current?.cropper.getCroppedCanvas().toDataURL();

    if (cropped != null) {
      onChange(cropped);
      setEdit(false);
    }
  });

  return (
    <div className={cn(previewClassName, "bg-brand")} style={{ aspectRatio }}>
      <SimpleDialog
        title="Cut Image"
        description="Scale it to the correct size."
        open={edit}
        onOpenChange={setEdit}
        contentProps={{
          className: "flex flex-col size-full max-w-none",
        }}
      >
        {preview ? (
          <Cropper
            ref={cropperRef}
            src={preview}
            aspectRatio={aspectRatio}
            className="flex-1 h-0"
            guides
          />
        ) : null}
        <Button color="primary" type="button" onClick={onCrop} className="mt-4">
          Crop
        </Button>
      </SimpleDialog>
      <input
        id={id}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const item = e.target.files?.item(0);

          if (item != null) {
            setSelected(item);
            setEdit(true);
          }
        }}
        multiple={false}
        {...input}
      />
      {value ? (
        <label htmlFor={id}>
          <img
            alt="selected file"
            src={value}
            className="size-full cursor-pointer"
          />
        </label>
      ) : (
        <label
          aria-label="Pick Image"
          htmlFor={id}
          className="flex flex-col gap-3 items-center justify-center p-2 size-full bg-muted border text-center text-muted-foreground/70 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="fill-accent-700 size-10"
          >
            <path d="M4 5h13v7h2V5c0-1.103-.897-2-2-2H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h8v-2H4V5z"></path>
            <path d="m8 11-3 4h11l-4-6-3 4z"></path>
            <path d="M19 14h-2v3h-3v2h3v3h2v-3h3v-2h-3z"></path>
          </svg>
          <p className="text-xs">Select Image</p>
        </label>
      )}
    </div>
  );
}

export function usePreview(
  selected: File | Blob | undefined | null,
): string | null {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (selected != null) {
      const url = URL.createObjectURL(selected);
      setPreview(url);

      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);

      return () => {};
    }
  }, [selected]);

  return preview;
}
