import { dirname } from "path";
import { fileURLToPath } from "url";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = tseslint.config(
  // Global ignores
  {
    ignores: ["node_modules/", ".next/", "src/components/ui/"],
  },

  // Next.js rules
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },

  // React hooks
  {
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },

  // TypeScript
  ...tseslint.configs.recommended,

  // Project rules
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
      // Prevent bare `location` — must use `window.location` to avoid SSR crashes
      "no-restricted-globals": [
        "error",
        {
          name: "location",
          message:
            "Use `window.location` instead of bare `location` to prevent 'ReferenceError: location is not defined' during SSR/SSG.",
        },
      ],
    },
  }
);

export default eslintConfig;
