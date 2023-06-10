import { upload, blobToBase64 } from "./upload";
import type { UploadAttachment } from "shared/schema/chat";
import type { RouterUtils } from "@/utils/trpc";

export async function uploadAttachment(
    utils: RouterUtils,
    file: File
): Promise<UploadAttachment> {
    const res = await upload(
        () =>
            utils.client.upload.signAttachment.query({
                filename: file.name,
            }),
        await blobToBase64(file),
        {
            resource_type: "auto",
        }
    );

    return {
        name: file.name,
        url: res.secure_url,
        type: res.resource_type,
        bytes: res.bytes,
        width: res.width,
        height: res.height,
    };
}
