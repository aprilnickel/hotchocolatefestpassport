import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F9F7F0",
        "dust-grey": "#DFD5CE",
        burgundy: "#592720",
        "burgundy-dark": "#471F19",
      },
    },
  },
  plugins: [],
};

export default config;
