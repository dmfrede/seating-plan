/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'agerup': {
          50: '#f7f3ee',
          100: '#ede4d5',
          200: '#d9c9aa',
          300: '#c4aa7e',
          400: '#b38f5e',
          500: '#9a7445',
          600: '#7d5c38',
          700: '#64482e',
          800: '#4e3824',
          900: '#3d2c1c',
        },
        'forest': {
          50: '#f0f5ee',
          100: '#ddebd9',
          200: '#bbd6b3',
          300: '#93bb89',
          400: '#6a9c60',
          500: '#4d7d43',
          600: '#3a6232',
          700: '#2e4e28',
          800: '#243e20',
          900: '#1c301a',
        }
      },
      fontFamily: {
        'serif': ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      }
    },
  },
  plugins: [],
}
