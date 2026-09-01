import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Reemplaza Inter (la fuente "por defecto de IA") en todo el proyecto
        // desde un solo lugar: `index.css` la fija como fuente base del body.
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Retinta la escala `blue` de Tailwind con el azul real del logo de
        // Hydra, en vez del azul genérico por defecto (#3b82f6). Como el resto
        // del proyecto ya usa `blue-*` de forma consistente (botones, enlaces,
        // focus rings, sidebar activo), este solo cambio reviste toda la
        // interfaz sin tocar archivo por archivo.
        blue: {
          50: '#eff6fb',
          100: '#dbeaf5',
          200: '#b9d8ec',
          300: '#87bcdd',
          400: '#4f97c8',
          500: '#2c78ac',
          600: '#1d6091',
          700: '#194d76',
          800: '#173f60',
          900: '#153552',
          950: '#0c2036',
        },
      },
    },
  },
  plugins: [forms],
}