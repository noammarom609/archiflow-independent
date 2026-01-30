/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      /* ═══════════════════════════════════════════════════════════════════
         FONT FAMILY - Heebo (Hebrew optimized, rounded)
         ═══════════════════════════════════════════════════════════════════ */
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'],
        heebo: ['Heebo', 'sans-serif'],
      },
      
      /* ═══════════════════════════════════════════════════════════════════
         BORDER RADIUS - Organic rounded corners (12-16px)
         ═══════════════════════════════════════════════════════════════════ */
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'organic': '12px',
        'organic-lg': '16px',
        'organic-xl': '24px',
      },
      
      /* ═══════════════════════════════════════════════════════════════════
         COLORS - Organic Modernism Palette
         ═══════════════════════════════════════════════════════════════════ */
      colors: {
        /* ArchiFlow Shorthand Colors (for direct use) */
        'archiflow-terracotta': '#984E39',
        'archiflow-forest-green': '#354231',
        'archiflow-taupe': '#8C7D70',
        'archiflow-espresso': '#4A3B32',
        'archiflow-off-white': '#F7F5F2',
        
        /* Core Palette */
        terracotta: {
          50: '#fdf5f3',
          100: '#fae9e4',
          200: '#f5d5cc',
          300: '#edb9a9',
          400: '#e19278',
          500: '#984E39', /* Primary */
          600: '#8a4633',
          700: '#73392a',
          800: '#603227',
          900: '#512d25',
        },
        forest: {
          50: '#f4f6f4',
          100: '#e6eae5',
          200: '#cdd6cb',
          300: '#a8b8a5',
          400: '#7d9478',
          500: '#5a7455',
          600: '#465c43',
          700: '#354231', /* Secondary */
          800: '#2d3829',
          900: '#262f24',
        },
        taupe: {
          50: '#f9f8f7',
          100: '#f2efed',
          200: '#e4dfdb',
          300: '#d2c9c2',
          400: '#b8aaa0',
          500: '#8C7D70', /* Neutral */
          600: '#7a6c60',
          700: '#655951',
          800: '#554b45',
          900: '#49413c',
        },
        espresso: {
          50: '#f7f5f4',
          100: '#edeae8',
          200: '#d9d3cf',
          300: '#c0b5ae',
          400: '#a29389',
          500: '#8a7a6f',
          600: '#7a6b60',
          700: '#655851',
          800: '#4A3B32', /* Text */
          900: '#3d322b',
        },
        
        /* System Colors (using CSS variables) */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },
      
      /* ═══════════════════════════════════════════════════════════════════
         BOX SHADOWS - Organic warm shadows
         ═══════════════════════════════════════════════════════════════════ */
      boxShadow: {
        'organic-sm': '0 1px 2px rgba(74, 59, 50, 0.05), 0 1px 3px rgba(74, 59, 50, 0.1)',
        'organic': '0 2px 4px rgba(74, 59, 50, 0.05), 0 4px 12px rgba(74, 59, 50, 0.1)',
        'organic-lg': '0 4px 6px rgba(74, 59, 50, 0.05), 0 10px 24px rgba(74, 59, 50, 0.12)',
        'organic-xl': '0 8px 16px rgba(74, 59, 50, 0.08), 0 20px 40px rgba(74, 59, 50, 0.15)',
        'glass': '0 8px 32px rgba(74, 59, 50, 0.1)',
      },
      
      /* ═══════════════════════════════════════════════════════════════════
         KEYFRAMES - Micro-interactions
         ═══════════════════════════════════════════════════════════════════ */
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-in-down': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' }
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' }
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' }
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
      },
      
      /* ═══════════════════════════════════════════════════════════════════
         ANIMATIONS
         ═══════════════════════════════════════════════════════════════════ */
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'fade-in-down': 'fade-in-down 0.3s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'slide-in-left': 'slide-in-left 0.4s ease-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      
      /* ═══════════════════════════════════════════════════════════════════
         BACKDROP BLUR - For Glassmorphism
         ═══════════════════════════════════════════════════════════════════ */
      backdropBlur: {
        xs: '2px',
        glass: '12px',
      },
      
      /* ═══════════════════════════════════════════════════════════════════
         TRANSITION TIMING
         ═══════════════════════════════════════════════════════════════════ */
      transitionTimingFunction: {
        'organic': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      
      transitionDuration: {
        '400': '400ms',
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
}
