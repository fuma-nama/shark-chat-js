import { ThemeProvider } from "./theme";
import "@/styles/globals.css";

export const metadata = {
    title: "Shark Chat",
    description: "An Open-Source Modern Chat App",
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
