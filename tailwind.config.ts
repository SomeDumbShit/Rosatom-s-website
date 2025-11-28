import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f2ff',
          100: '#cce5ff',
          200: '#99ccff',
          300: '#66b3ff',
          400: '#3399ff',
          500: '#0080ff',
          600: '#0066cc',  // Корпоративный синий Росатома
          700: '#0052a3',
          800: '#003d7a',
          900: '#002952',
        },
        accent: {
          50: '#f8f9fa',   // Светло-серый
          100: '#e9ecef',
          200: '#dee2e6',
          300: '#ced4da',
          400: '#adb5bd',
          500: '#6c757d',  // Корпоративный серый Росатома
          600: '#5a6268',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config
