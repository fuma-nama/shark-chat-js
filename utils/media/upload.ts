import { SignResponse } from "@/server/routers/upload";
import { z } from "zod";
import { cloudName } from "./format";

const uploadResponseSchema = z.object({
    secure_url: z.string(),
    version: z.number(),
});

type UploadResponse = z.infer<typeof uploadResponseSchema>;

export type UploadOptions = {
    file: string;
} & SignResponse;

async function uploadAsset(options: UploadOptions): Promise<UploadResponse> {
    const body = new FormData();

    body.append("file", options.file);
    body.append("signature", options.signature);
    body.append("api_key", options.api_key);
    body.append("timestamp", options.timestamp.toString());

    if (options.resource_type != null) {
        body.append("resource_type", options.resource_type);
    }
    if (options.transformation != null) {
        body.append("transformation", options.transformation);
    }
    if (options.public_id != null) {
        body.append("public_id", options.public_id);
    }

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
            method: "POST",
            body: body,
        }
    );

    if (!res.ok) throw new Error(await res.json());
    return uploadResponseSchema.parse(await res.json());
}

export async function upload(sign: () => Promise<SignResponse>, file: string) {
    const signed = await sign();

    return uploadAsset({
        file: file,
        ...signed,
    });
}
