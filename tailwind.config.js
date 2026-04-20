/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FAF7F2',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#7BBFCF',
          hover: '#5AA3B7',
        },
        text: {
          primary: '#2C2C2C',
          secondary: '#8A8A8A',
        },
        border: '#E8E2D9',
        success: '#7BBFCF',
        error: '#C97B7B',
        warning: '#C9A96E',
      },
      borderRadius: {
        card: '16px',
        button: '12px',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(0,0,0,0.06)',
        'soft-lg': '0 8px 32px rgba(0,0,0,0.08)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Pretendard',
          'Noto Sans KR',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
