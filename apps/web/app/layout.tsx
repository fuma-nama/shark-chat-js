import { Metadata } from "next";
import { ThemeProvider } from "./theme";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { getBaseUrl } from "@/utils/get-base-url";

export const metadata: Metadata = {
  title: "Shark Chat",
  description: "An Open-Source Modern Chat App",
  twitter: {
    card: "summary_large_image",
  },
  metadataBase: new URL(getBaseUrl()),
};

const inter = Inter({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
