const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;

export function groupIcon(groupId: string, format = "png", hash: number) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/v${hash}/icons/${groupId}.${format}`;
}
