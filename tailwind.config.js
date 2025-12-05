/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      scale: {
        '98': '0.98',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thin::-webkit-scrollbar': {
          'width': '6px',
          'height': '6px',
        },
        '.scrollbar-thin::-webkit-scrollbar-track': {
          'background': 'rgba(255, 255, 255, 0.05)',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb': {
          'background': 'rgba(255, 255, 255, 0.2)',
          'border-radius': '3px',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb:hover': {
          'background': 'rgba(255, 255, 255, 0.3)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
