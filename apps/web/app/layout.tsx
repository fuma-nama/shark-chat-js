import { Metadata } from "next";
import { ThemeProvider } from "./theme";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Shark Chat",
  description: "An Open-Source Modern Chat App",
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
