const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export function groupIcon(groupId: string, hash: number, format = "png") {
    return `https://res.cloudinary.com/${cloudName}/image/upload/v${hash}/icons/${groupId}.${format}`;
}
