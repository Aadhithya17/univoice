/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          850: '#18181b', // Zinc-900 equivalent (was #1b2234)
          900: '#18181b', // Zinc-900 equivalent (was #0f172a default)
          905: '#09090b', // Zinc-950 equivalent (was #0c101d)
          950: '#09090b', // Zinc-950 equivalent (was #020617 default)
          205: '#e2e8f0',
        },
        brand: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          450: '#a1a1aa', // safeguard for text-brand-450
          500: '#ffffff', // Primary accent is white/silver
          600: '#18181b', // Primary buttons are dark zinc-900
          700: '#27272a', // Primary hover is zinc-800
          800: '#3f3f46',
          900: '#52525b',
          950: '#09090b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
