import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Prevent console.log in production code
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Enforce consistent imports
      "prefer-const": "error",
      "no-var": "error",
      // React best practices
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // TypeScript
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    ignores: ["node_modules/", ".next/", "src/components/ui/"],
  },
];

export default eslintConfig;
