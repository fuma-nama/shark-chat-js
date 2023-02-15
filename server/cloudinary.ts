import { v2 } from "cloudinary";

const cloudinary = v2;

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("Connected to Cloudinary!");

cloudinary.api.create_upload_preset({
    name: "",
    resource_type: "image",
    transformation: {
        width: 300,
        height: 300,
        crop: "pad",
        audio_codec: "none",
    },
});
export default cloudinary;
