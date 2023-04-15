export const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export const groupIcon = media<[groupId: number]>({
    publicId: ([groupId]) => `icons/${groupId}`,
});

export const userAvatar = media<[userId: string]>({
    publicId: ([userId]) => `avatars/${userId}`,
});

function media<Args extends any[]>({
    publicId,
}: {
    publicId: (args: Args) => string;
}): {
    id: (...args: Args) => string;
    url(args: Args, hash: number, format?: "png"): string;
    url(args: Args, hash: number | null, format?: "png"): string | null;
} {
    return {
        id: (...args) => publicId(args),
        url: (args, hash, format = "png") => {
            if (hash == null) return null as any;

            return `https://res.cloudinary.com/${cloudName}/image/upload/v${hash}/${publicId(
                args
            )}.${format}`;
        },
    };
}
