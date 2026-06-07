/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand accents (used sparingly to preserve their value)
        terracotta: '#B35A3D',
        palm: '#315C45',
        gold: '#C8A96A',
        sand: '#D8C3A5',
        // Refined neutral system (editorial real estate)
        midnight: '#172033',  // deep blue-ink reserved for big headlines on dark
        ink: '#0F1419',       // primary text & H tags — sharper than text-primary
        stone: '#5A5249',     // refined warm gray for metadata (more elegant than #6E6259)
        cream: '#FAF7F1',
        'cream-warm': '#F8F3EA',
        'text-primary': '#1E1E1E',
        'text-secondary': '#6E6259',
        'border-warm': '#E8DED2',
        'border-subtle': '#EFE8DE',  // even softer than border-warm, for delicate dividers
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        /*
         * Editorial type system (inspired by chrifiahills.com).
         *
         * `display` — Schibsted Grotesk, refined Norwegian sans for headlines,
         *             hero, prices, big numbers. Replaces Playfair for the
         *             "loud" voice. Use for H1-H4 and any large editorial type.
         *
         * `serif`   — Newsreader variable serif for long-form prose & elegant
         *             subtitles. Beautiful italics. Use for property
         *             descriptions, blog body, about-page paragraphs.
         *
         * `inter`   — kept for UI (nav, buttons, forms, badges, metadata).
         *
         * `playfair` is kept as a legacy fallback only — any remaining
         *            `font-playfair` className still works, but new code
         *            should use `font-display` or `font-serif`.
         */
        display: ['Schibsted Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Newsreader', 'Charter', 'Georgia', 'serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
        playfair: ['Playfair Display', 'Newsreader', 'Georgia', 'serif'],
      },
      borderRadius: {
        'card': '16px',
        'card-lg': '24px',
        'pill': '9999px',
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        // Layered shadows — premium feel comes from STACK not blur radius
        'card': '0 1px 2px rgba(15,20,25,0.04), 0 4px 12px -4px rgba(15,20,25,0.06)',
        'card-hover': '0 1px 3px rgba(15,20,25,0.06), 0 16px 40px -12px rgba(15,20,25,0.18)',
        'search': '0 1px 3px rgba(15,20,25,0.05), 0 8px 32px -8px rgba(15,20,25,0.12)',
        'soft': '0 1px 2px rgba(15,20,25,0.04)',
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      letterSpacing: {
        'editorial': '-0.02em',  // for big editorial headlines (tighter)
        'eyebrow': '0.18em',     // for tiny uppercase eyebrows (tagline)
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.22, 1, 0.36, 1)',  // refined ease-out
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
