export const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export const groupIcon = media<[groupId: string]>({
  publicId: ([groupId]) => `icons/${groupId}`,
});

export const groupBanners = media<[groupId: string]>({
  publicId: ([groupId]) => `banners/${groupId}`,
});

export const emotes = media<[id: string]>({
  publicId: ([id]) => `emotes/${id}`,
});

export const userAvatar = media<[userId: string]>({
  publicId: ([userId]) => `avatars/${userId}`,
});

export const attachment = media<
  [userId: string, attachmentId: string, filename: string]
>({
  publicId: ([userId, attachmentId, filename]) =>
    `attachments/${userId}/${attachmentId}/${filename}`,
});

function media<Args extends any[]>({
  publicId,
}: {
  publicId: (args: Args) => string;
}): {
  id: (...args: Args) => string;
  url(args: Args, hash: "default" | number, format?: "png"): string;
  url(args: Args, hash: number | null, format?: "png"): string | null;
} {
  return {
    id: (...args) => publicId(args),
    url: (args, hash, format = "png") => {
      if (hash == null) return null as any;
      if (hash === "default")
        return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId(
          args,
        )}.${format}`;

      return `https://res.cloudinary.com/${cloudName}/image/upload/v${hash}/${publicId(
        args,
      )}.${format}`;
    },
  };
}
