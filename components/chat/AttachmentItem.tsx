import { CldImage } from "next-cloudinary";
import Link from "next/link";
import { text } from "../system/text";
import { AttachmentType } from "@/server/schema/chat";

export function UploadingAttachmentItem({ file }: { file: File }) {
    return (
        <div className="p-3 rounded-lg bg-light-100 dark:bg-dark-700 flex flex-col">
            <p className={text({ size: "md", type: "primary" })}>{file.name}</p>
            <p className={text({ type: "secondary", size: "sm" })}>
                Uploading...
            </p>
        </div>
    );
}

export function AttachmentItem({ attachment }: { attachment: AttachmentType }) {
    if (attachment.type === "image") {
        const cloudinary_prefix =
            "https://res.cloudinary.com/shark-chat/image/upload/";

        if (attachment.url.startsWith(cloudinary_prefix))
            return (
                <div
                    className="relative max-h-[500px] w-auto"
                    style={{
                        aspectRatio:
                            (attachment.width ?? 100) /
                            (attachment.height ?? 100),
                    }}
                >
                    <CldImage
                        alt={attachment.name}
                        src={attachment.url.slice(cloudinary_prefix.length)}
                        fill
                        className="rounded-xl"
                    />
                </div>
            );
    }

    return (
        <div className="p-3 rounded-lg bg-light-100 dark:bg-dark-700 flex flex-col">
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
