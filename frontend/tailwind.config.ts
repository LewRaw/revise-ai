import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Oficial Fintech (PicPay / Nubank inspired)
        fintech: {
          bg: '#000000',        // Fundo preto puro absoluto
          card: '#141414',      // Superfície neutra elevada
          cardHover: '#1C1C1C', // Hover e sub-cartões
          input: '#1A1A1A',     // Inputs e campos
          border: '#262626',    // Divisores discretos
          primary: '#11C76F',   // Verde sólido institucional
          primaryHover: '#0FB363',
          danger: '#EF4444',
          warning: '#F59E0B',
          info: '#3B82F6',
          textMuted: '#8E8E93',
        },
      },
      borderRadius: {
        'fintech': '1rem',      // 16px
        'fintech-lg': '1.25rem',// 20px
      },
      screens: {
        'xs': '320px',          // Suporte obrigatório a smartphones compactos
      },
    },
  },
  plugins: [],
};

export default config;
