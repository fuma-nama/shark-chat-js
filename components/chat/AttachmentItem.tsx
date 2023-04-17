import { CldImage } from "next-cloudinary";
import Link from "next/link";
import { text } from "../system/text";
import { AttachmentType } from "@/server/schema/chat";

export function UploadingAttachmentItem({ file }: { file: File }) {
    return (
        <div className="p-3 rounded-lg bg-light-100 dark:bg-dark-700 flex flex-col mt-3">
            <p className={text({ size: "md", type: "primary" })}>{file.name}</p>
            <p className={text({ type: "secondary", size: "sm" })}>
                Uploading...
            </p>
        </div>
    );
}

const cloudinary_prefix = "https://res.cloudinary.com/shark-chat/image/upload/";

export function AttachmentItem({ attachment }: { attachment: AttachmentType }) {
    if (
        attachment.type === "image" &&
        attachment.width != null &&
        attachment.height != null &&
        attachment.url.startsWith(cloudinary_prefix)
    ) {
        const maxW = Math.min(500, attachment.width);
        const maxH = Math.min(400, attachment.height);
        const url = decodeURIComponent(attachment.url).slice(
            cloudinary_prefix.length
        );

        return (
            <div>
                <div
                    className="relative w-auto mt-3"
                    style={{
                        aspectRatio: attachment.width / attachment.height,
                        maxWidth: `${maxW}px`,
                        maxHeight: `${maxH}px`,
                    }}
                >
                    <CldImage
                        alt={attachment.name}
                        src={url}
                        fill
                        className="rounded-xl"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 rounded-lg bg-light-100 dark:bg-dark-700 flex flex-col mt-3">
            <Link
                target="_blank"
                href={attachment.url}
                className={text({ size: "md", type: "primary" })}
            >
                {attachment.name}
            </Link>
            <p className={text({ type: "secondary", size: "sm" })}>
                {attachment.bytes} Bytes
            </p>
        </div>
    );
}
