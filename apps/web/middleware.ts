export { default } from "next-auth/middleware";

export const config = {
    matcher: ["/", "/home", "/settings", "/chat/:path*", "/dm/:path*"],
};
