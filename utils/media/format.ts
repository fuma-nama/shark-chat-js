import type { TransformationOptions, UploadApiOptions } from "cloudinary";

export const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export const groupIcon = media<[groupId: number]>({
    publicId: ([groupId]) => `icons/${groupId}`,
    type: "image",
    transformation: {
        width: 300,
        height: 300,
        crop: "pad",
        audio_codec: "none",
    },
});

export const userAvatar = media<[userId: string]>({
    publicId: ([userId]) => `avatars/${userId}`,
    type: "image",
    transformation: {
        width: 300,
        height: 300,
        crop: "pad",
        audio_codec: "none",
    },
});

function media<Args extends any[]>({
    publicId,
    transformation,
    type,
}: {
    publicId: (args: Args) => string;
    type?: "image" | "video" | "raw" | "auto";
    transformation?: TransformationOptions;
}): {
    id: (...args: Args) => string;
    url: (args: Args, hash: number, format?: "png") => string;
    uploadOptions: (...args: Args) => UploadApiOptions;
} {
    return {
        id: (...args) => publicId(args),
        uploadOptions: (...args) => ({
            public_id: publicId(args),
            resource_type: type,
            transformation,
        }),
        url: (args, hash, format) => {
            return `https://res.cloudinary.com/${cloudName}/image/upload/v${hash}/${publicId(
                args
            )}.${format}`;
        },
    };
}
