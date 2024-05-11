import { blobToBase64, upload } from "./upload";
import type { UploadAttachment } from "shared/schema/chat";
import type { RouterUtils } from "@/utils/trpc";

const forced: Record<string, "raw" | "image"> = {
  "application/pdf": "raw",
};

export async function uploadAttachment(
  utils: RouterUtils,
  file: File,
): Promise<UploadAttachment> {
  const res = await upload(
    () =>
      utils.client.upload.signAttachment.query({
        filename: file.name,
      }),
    await blobToBase64(file),
    {
      resource_type: forced[file.type] ?? "auto",
    },
  );

  return {
    name: file.name,
    url: res.secure_url,
    type: res.resource_type,
    bytes: res.bytes,
    width: res.width!,
    height: res.height!,
  };
}
