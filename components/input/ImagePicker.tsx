/* eslint-disable @next/next/no-img-element */
import React, { createRef, useEffect, useRef, useState } from "react";
import Button from "../Button";
import { Cropper, ReactCropperElement } from "react-cropper";
import { ImageIcon } from "@radix-ui/react-icons";
import clsx from "clsx";

export function ImagePicker({
    value,
    onChange,
    previewClassName,
    id,
}: {
    value: string | null;
    onChange: (v: string) => void;
    previewClassName?: string;
    id?: string;
}) {
    const [selected, setSelected] = useState<File | null>();
    const [preview, setPreview] = useState<string | null>();
    const ref = createRef<HTMLInputElement>();
    const cropperRef = useRef<ReactCropperElement>(null);

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
                    <Button variant="primary" type="button" onClick={onCrop}>
                        Crop
                    </Button>
                    <Button type="button" onClick={() => setSelected(null)}>
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    const onPick = () => ref.current?.click();

    return (
        <div className={previewClassName}>
            <input
                id={id}
                type="file"
                className="hidden"
                ref={ref}
                accept="image/*"
                onChange={(e) => {
                    const item = e.target.files?.item(0);

                    if (item != null) setSelected(item);
                }}
                multiple={false}
            />
            {value != null ? (
                <img
                    alt="selected file"
                    src={value}
                    className="w-full h-full rounded-xl cursor-pointer"
                    onClick={onPick}
                />
            ) : (
                <div
                    className={clsx(
                        "flex flex-col gap-3 items-center justify-center p-4 w-full h-full rounded-xl cursor-pointer",
                        "bg-light-200 text-accent-900",
                        "dark:bg-dark-700 dark:text-accent-500"
                    )}
                    onClick={onPick}
                >
                    <ImageIcon className="w-6 h-6" />
                </div>
            )}
        </div>
    );
}
