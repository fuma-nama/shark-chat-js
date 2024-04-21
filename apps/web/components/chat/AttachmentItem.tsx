import Link from "next/link";
import { AttachmentType } from "shared/schema/chat";
import { useState } from "react";
import { SmartImage } from "ui/components/smart-image";
import Image from "next/image";

export function UploadingAttachmentItem({ file }: { file: File }) {
  return (
    <div className="p-3 rounded-lg bg-light-100 dark:bg-dark-700 flex flex-col mt-3">
      <p className="text-foreground text-base font-medium">{file.name}</p>
      <p className="text-sm text-muted-foreground">Uploading...</p>
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
    return <AttachmentImage attachment={attachment} />;
  }

  return (
    <div className="p-3 rounded-lg bg-light-100 dark:bg-dark-700 mt-3">
      <Link
        target="_blank"
        href={attachment.url}
        className="text-base font-medium text-foreground"
      >
        {attachment.name}
      </Link>
      <p className="text-sm text-muted-foreground">{attachment.bytes} Bytes</p>
    </div>
  );
}

function AttachmentImage({ attachment }: { attachment: AttachmentType }) {
  const [state, setState] = useState<"loading" | "loaded">("loading");
  const url = decodeURIComponent(attachment.url).slice(
    cloudinary_prefix.length,
  );

  return (
    <div>
      <SmartImage
        state={state}
        width={attachment.width!!}
        height={attachment.height!!}
        maxWidth={500}
        maxHeight={400}
      >
        <Image
          alt={attachment.name}
          src={url}
          fill
          sizes={`(max-width: 500px) 90vw, 500px`}
          loader={({ src, width, quality }) => {
            const params = ["c_limit", `w_${width}`, `q_${quality || "auto"}`];

            return `${cloudinary_prefix}${params.join(",")}/${src}`;
          }}
          onLoadingComplete={() => setState("loaded")}
        />
      </SmartImage>
    </div>
  );
}
