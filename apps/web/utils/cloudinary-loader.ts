import type { ImageLoader } from "next/image";

export const cloudinary_prefix =
  "https://res.cloudinary.com/shark-chat/image/upload/";

export const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  const params = ["c_limit", `w_${width}`, `q_${quality || "auto"}`];

  if (src.startsWith(cloudinary_prefix)) {
    src = src.slice(cloudinary_prefix.length);
  }

  return encodeURI(`${cloudinary_prefix}${params.join(",")}/${src}`);
};
