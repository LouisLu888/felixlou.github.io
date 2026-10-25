/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // System CJK serifs only: Google Fonts is blocked in mainland China.
        display: ['"Songti SC"', '"Source Han Serif SC"', '"Noto Serif CJK SC"', '"Noto Serif SC"', 'STSong', 'SimSun', 'serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
