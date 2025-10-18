/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'maritime-blue': '#0A2463',
        'maritime-light': '#3E92CC',
        'maritime-dark': '#001233',
      },
    },
  },
  plugins: [],
}
