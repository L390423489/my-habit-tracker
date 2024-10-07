/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html", // Include if you have Tailwind classes in your HTML
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.blue[600],
        secondary: colors.purple[600],
        success: colors.green[500],
        danger: colors.red[500],
        warning: colors.yellow[500],
        info: colors.blue[400],
        light: colors.gray[100],
        dark: colors.gray[800],
        // Include all colors you use dynamically
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      keyframes: {
        streakAnimation: {
          '0%': {
            transform: 'scale(1)',
          },
          '50%': {
            transform: 'scale(1.5) rotate(20deg)',
            opacity: '0.5',
          },
          '100%': {
            transform: 'scale(1)',
          },
        },
      },
      animation: {
        streak: 'streakAnimation 1s ease-in-out',
      },
    },
  },
  safelist: [
    {
      pattern: /bg-(red|green|blue|yellow|gray|purple|pink|indigo|teal|orange|cyan|lime)-(100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /text-(red|green|blue|yellow|gray|purple|pink|indigo|teal|orange|cyan|lime)-(100|200|300|400|500|600|700|800|900)/,
    },
    // Add any other patterns for dynamic class names you use
  ],
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

