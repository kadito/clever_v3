/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Color palette based on old_src
        primary: {
          DEFAULT: 'rgb(117, 174, 147)', // Main green #75AE93
          50: 'rgb(237, 247, 242)',
          100: 'rgb(219, 239, 229)',
          200: 'rgb(183, 223, 203)',
          300: 'rgb(147, 207, 177)',
          400: 'rgb(132, 190, 162)',
          500: 'rgb(117, 174, 147)', // Main color
          600: 'rgb(97, 154, 127)',
          700: 'rgb(77, 134, 107)',
          800: 'rgb(58, 104, 82)',
          900: 'rgb(39, 69, 55)',
        },
        secondary: {
          DEFAULT: '#2c3e50', // Dark blue-gray
          50: '#f8f9fa',
          100: '#e9ecef',
          200: '#dee2e6',
          300: '#ced4da',
          400: '#adb5bd',
          500: '#6c757d',
          600: '#495057',
          700: '#343a40',
          800: '#2c3e50',
          900: '#212529',
        },
        success: 'rgb(117, 174, 147)', // Same as primary
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
        light: '#f5f5f5',
        dark: '#333333',
        muted: '#6c757d',
      },
      screens: {
        // Mobile-first breakpoints
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      spacing: {
        // Touch-friendly spacing
        touch: '44px', // Minimum touch target size
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      fontSize: {
        // Mobile-optimized typography
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      borderRadius: {
        touch: '8px', // Touch-friendly border radius
      },
      boxShadow: {
        mobile: '0 2px 8px rgba(0, 0, 0, 0.1)',
        'mobile-lg': '0 4px 16px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
};
