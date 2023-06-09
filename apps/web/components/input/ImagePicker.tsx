/* eslint-disable @next/next/no-img-element */
import React, { ComponentProps, useEffect, useRef, useState } from "react";
import { Button } from "../system/button";
import { Cropper, ReactCropperElement } from "react-cropper";
import clsx from "clsx";

export function ImagePicker({
    value,
    onChange,
    previewClassName,
    input,
}: {
    value: string | null;
    onChange: (v: string) => void;
    previewClassName?: string;
    input?: ComponentProps<"input">;
}) {
    const [selected, setSelected] = useState<File | null>();
    const [preview, setPreview] = useState<string | null>();
    const cropperRef = useRef<ReactCropperElement>(null);

    const id = input?.id ?? "image-upload";

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

    if (preview != null) {
        const onCrop = () => {
            const cropped = cropperRef.current?.cropper
                .getCroppedCanvas()
                .toDataURL();

            if (cropped != null) {
                onChange(cropped);
                setSelected(null);
            }
        };

        return (
            <div className="flex flex-col gap-3">
                <Cropper
                    src={preview}
                    aspectRatio={1}
                    guides
                    ref={cropperRef}
                />
                <div className="flex flex-row gap-3">
                    <Button color="primary" type="button" onClick={onCrop}>
                        Crop
                    </Button>
                    <Button type="button" onClick={() => setSelected(null)}>
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={previewClassName}>
            <input
                id={id}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    const item = e.target.files?.item(0);

                    if (item != null) setSelected(item);
                }}
                multiple={false}
                {...input}
            />
            {value != null ? (
                <label htmlFor={id}>
                    <img
                        alt="selected file"
                        src={value}
                        className="w-full h-full rounded-xl cursor-pointer"
                    />
                </label>
            ) : (
                <label
                    htmlFor={id}
                    className={clsx(
                        "flex flex-col gap-3 items-center justify-center p-2 w-full h-full rounded-xl cursor-pointer",
                        "bg-white border-[1px] text-center border-accent-500 text-accent-700",
                        "dark:bg-dark-800 dark:border-accent-900"
                    )}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        className="fill-accent-700 w-10 h-10"
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
