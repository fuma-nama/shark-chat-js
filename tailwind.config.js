const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["pages/**/*.tsx", "components/**/*.tsx"],
    darkMode: "class",
    theme: {
        extend: {
            animation: {
                "fade-in": "fade-in 0.2s ease-out",
            },
            keyframes: {
                "fade-in": {
                    from: {
                        opacity: "0",
                    },
                    to: {
                        opacity: "100%",
                    },
                },
            },
            colors: {
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
                },
                brand: {
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
    plugins: [require("tailwindcss-radix")()],
};
