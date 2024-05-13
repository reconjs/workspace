const twg = "var(--tw-gradient-stops)"

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "../*/src/**/*.{js,ts,jsx,tsx}",
    "../../../packages/*/*/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": `radial-gradient(${twg})`,
        "gradient-conic": `conic-gradient(from 180deg at 50% 50%, ${twg})`,
      },
    },
  },
  plugins: [],
}
