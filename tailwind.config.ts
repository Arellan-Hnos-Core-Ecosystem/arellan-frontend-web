import type { Config } from "tailwindcss";

const config: Config = {
  presets: [require("@arellan-hnos-core-ecosystem/ui/tailwind")],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@arellan-hnos-core-ecosystem/ui/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
