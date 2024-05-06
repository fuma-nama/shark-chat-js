import { Metadata } from "next";
import { ThemeProvider } from "./theme";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Shark Chat",
  description: "An Open-Source Modern Chat App",
  twitter: {
    card: "summary_large_image",
  },
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000",
  ),
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
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
