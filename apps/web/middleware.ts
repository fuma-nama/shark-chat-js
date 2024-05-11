export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/", "/settings", "/chat/:path*", "/dm/:path*"],
};
