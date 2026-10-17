import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Oficial Fintech (PicPay / Nubank inspired)
        fintech: {
          bg: '#000000',       // Preto puro
          card: '#141414',     // Superfície neutra elevada
          cardHover: '#1C1C1C',// Hover sutil
          border: '#262626',   // Divisores discretos
          primary: '#11C76F',  // Verde sólido institucional
          primaryHover: '#0FB363',
          danger: '#EF4444',
          textMuted: '#A3A3A3',
        },
      },
      borderRadius: {
        'fintech': '1rem',     // 16px
        'fintech-lg': '1.25rem',// 20px
      },
      screens: {
        'xs': '320px',         // Suporte obrigatório a smartphones compactos
      },
    },
  },
  plugins: [],
};

export default config;
