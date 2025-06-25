/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#203c74',
          light: '#2d4d8c',
          dark: '#162b54'
        },
        accent: {
          DEFAULT: '#203c74',
          light: '#2d4d8c',
          dark: '#162b54'
        }
      }
    },
  },
  plugins: [],
} 