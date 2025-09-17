/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./candomble.html", "./dist/index.html", "./src/**/*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light"],
    base: false,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
    themeRoot: ":root",
  },
};
