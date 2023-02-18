import { v2 } from "cloudinary";

const cloudinary = v2;

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("Connected to Cloudinary!");

export default cloudinary;
