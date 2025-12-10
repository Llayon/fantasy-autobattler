import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fantasy: {
          gold: '#ffd700',
          purple: '#6b21a8',
          dark: '#1a1a2e',
        },
      },
    },
  },
  plugins: [],
};

export default config;
