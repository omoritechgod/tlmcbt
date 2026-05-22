/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tlm: {
          primary: '#0F4C81',
          accent: '#F4A261',
          dark: '#1A1A2E',
        },
      },
    },
  },
  plugins: [],
};
