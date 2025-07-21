/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8f6f3',
          100: '#f0ebe3',
          200: '#e4d7c7',
          300: '#d8c9ae',
          400: '#c9b595',
          500: '#b8a082',
          600: '#a08c70',
          700: '#87755e',
          800: '#6f614f',
          900: '#5a4f42',
        },
        secondary: {
          50: '#f7f7f7',
          100: '#ededed',
          200: '#dfdfdf',
          300: '#c4c4c4',
          400: '#a8a8a8',
          500: '#8c8c8c',
          600: '#757575',
          700: '#575757',
          800: '#454545',
          900: '#3a3a3a',
        }
      }
    },
  },
  plugins: [],
};
