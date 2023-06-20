const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "pages/**/*.tsx",
        "app/**/*.tsx",
        "components/**/*.tsx",
        "../../packages/ui/**/*.tsx",
    ],
    darkMode: "class",
    theme: {
        extend: {
            typography: ({ theme }) => ({
                message: {
                    css: {
                        "--tw-prose-body": "hsl(var(--foreground))",
                        "--tw-prose-headings": "hsl(var(--foreground))",
                        "--tw-prose-lead": "hsl(var(--foreground))",
                        "--tw-prose-links": theme("colors.purple[400]"),
                        "--tw-prose-bold": "hsl(var(--foreground))",
                        "--tw-prose-counters": "hsl(var(--muted-foreground))",
                        "--tw-prose-bullets": "hsl(var(--foreground))",
                        "--tw-prose-hr": "hsl(var(--foreground))",
                        "--tw-prose-quotes": "hsl(var(--foreground))",
                        "--tw-prose-quote-borders": "hsl(var(--border))",
                        "--tw-prose-captions": "hsl(var(--foreground))",
                        "--tw-prose-code": "hsl(var(--foreground))",
                        "--tw-prose-pre-code": "hsl(var(--foreground))",
                        "--tw-prose-pre-bg": "hsl(var(--secondary))",
                        "--tw-prose-th-borders": "hsl(var(--border))",
                        "--tw-prose-td-borders": "hsl(var(--border))",
                        a: {
                            color: theme("colors.brand[500]"),
                            "font-weight": "400",
                            "text-decoration": "none",
                            "&:hover": {
                                "text-decoration": "underline",
                            },
                        },
                        ".dark a": {
                            color: theme("colors.brand[200]"),
                        },
                    },
                },
            }),
            fontFamily: {
                sans: [
                    "Inter",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "Segoe UI",
                    "Roboto",
                    "Oxygen",
                    "Ubuntu",
                    "Cantarell",
                    "Fira Sans",
                    "Droid Sans",
                    "Helvetica Neue",
                    "sans-serif",
                ],
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--border))",
                ring: "hsl(var(--brand))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                dark: {
                    50: "#d0dcfb",
                    100: "#aac0fe",
                    200: "#a3b9f8",
                    300: "#728fea",
                    400: "#3652ba",
                    500: "#1b3bbb",
                    600: "#24388a",
                    700: "#1B254B",
                    800: "#111c44",
                    900: "#0b1437",
                    950: "#080f2c",
                },
                brand: {
                    DEFAULT: "hsl(var(--brand))",
                    100: "#e4ddff",
                    200: "#b0acff",
                    300: "#8e72ff",
                    400: "#7551FF",
                    500: "#422AFB",
                    600: "#3311DB",
                    700: "#02044A",
                    800: "#190793",
                    900: "#11047A",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--foreground))",
                    50: colors.gray[50],
                    100: "#E0E5F2",
                    200: "#E1E9F8",
                    300: "#F4F7FE",
                    400: "#E9EDF7",
                    500: "#b8c2de",
                    600: "#A3AED0",
                    700: "#707EAE",
                    800: "#5d6991",
                    900: "#1B2559",
                },
                light: {
                    ...colors.slate,
                },
            },
        },
    },
    plugins: [
        require("tailwindcss-radix")(),
        require("tailwindcss-animate"),
        require("@tailwindcss/typography"),
    ],
};
