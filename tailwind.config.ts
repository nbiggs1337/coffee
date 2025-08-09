import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
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
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
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
        // Coffee-themed Neobrutalism colors
        neobrutal: {
          primary: "#2d1810", // Dark coffee brown
          secondary: "#8b6f47", // Medium coffee brown
          background: "#f5f1eb", // Cream background
          yellow: "#8b4513", // Coffee brown (was bright yellow)
          green: "#6b8e23", // Olive green
          blue: "#4682b4", // Steel blue
          red: "#a0522d", // Sienna red
          text: "#2d1810", // Dark coffee brown for text
        },
        // Additional coffee theme colors
        coffee: {
          50: "#faf8f5",
          100: "#f5f1eb",
          200: "#e6d7c3",
          300: "#d4bc9a",
          400: "#c19a6b",
          500: "#8b6f47",
          600: "#8b4513",
          700: "#6b3410",
          800: "#4a240b",
          900: "#2d1810",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "coffee-steam": {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "0.7" },
          "50%": { transform: "translateY(-10px) rotate(5deg)", opacity: "1" },
          "100%": { transform: "translateY(-20px) rotate(-5deg)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "coffee-steam": "coffee-steam 2s ease-in-out infinite",
      },
      boxShadow: {
        neobrutalism: "var(--neobrutal-shadow-offset) var(--neobrutal-shadow-offset) 0px #2d1810",
        "neobrutalism-sm":
          "calc(var(--neobrutal-shadow-offset) / 2) calc(var(--neobrutal-shadow-offset) / 2) 0px #2d1810",
        "neobrutalism-lg":
          "calc(var(--neobrutal-shadow-offset) * 1.5) calc(var(--neobrutal-shadow-offset) * 1.5) 0px #2d1810",
        "coffee-glow": "0 0 20px rgba(139, 69, 19, 0.3)",
      },
      fontFamily: {
        coffee: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
