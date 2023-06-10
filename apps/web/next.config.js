/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ["ably-builder", "db", "server", "shared", "ui"],
    images: {
        domains: ["https://res.cloudinary.com"],
        deviceSizes: [350, 500, 640, 828, 1080, 1200, 1920, 2048, 3840],
    },
    async redirects() {
        return [{ source: "/", destination: "/home", permanent: false }];
    },
};

module.exports = nextConfig;
