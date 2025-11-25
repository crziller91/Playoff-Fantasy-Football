import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const config = [
  ...nextCoreWebVitals,
  ...compat.extends("plugin:tailwindcss/recommended"),
  ...compat.extends("prettier"),
  {
    settings: {
      tailwindcss: {
        callees: ["twMerge", "createTheme"],
        classRegex: "^(class(Name)|theme)?$",
      },
    },
  },
];

export default config;
