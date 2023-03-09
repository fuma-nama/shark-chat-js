import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { trpc } from "../trpc";
import { cloudName } from "./format";

const uploadResponseSchema = z.object({
    secure_url: z.string(),
});

export type UploadOptions = {
    file: string;
    signature: string;
    api_key: string;
    timestamp: number;
    resource_type?: "image";
    transformation?: string;
    public_id?: string;
};

async function uploadImage(options: UploadOptions) {
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

export function useUpdateProfileMutation() {
    const { status } = useSession();
    const client = trpc.useContext().client;
    const sign = trpc.account.signUploadAvatar.useQuery(undefined, {
        enabled: status === "authenticated",
    });

    const uploadAvatar = async (avatar: string) => {
        const signed = sign.data;

        if (avatar != null && status === "authenticated" && signed != null) {
            return uploadImage({
                file: avatar,
                resource_type: "image",
                ...signed,
            });
        }

        return null;
    };

    return useMutation(
        async ({ name, avatar }: { name?: string; avatar?: string }) => {
            let avatar_url: string | undefined;

            if (avatar != null) {
                const res = await uploadAvatar(avatar);
                avatar_url = res?.secure_url;
            }

            return client.account.updateProfile.mutate({
                name,
                avatar_url,
            });
        }
    );
}
