import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
    globalIgnores(["src/api/*/schema.ts"]),
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: { globals: globals.node }
    },
    tseslint.configs.recommended,
    {
        files: ["**/*.test.ts", "**/*.spec.ts"],
        plugins: { vitest },
        rules: {
            ...vitest.configs.recommended.rules,
            "vitest/consistent-test-it": ["error", { fn: "test", withinDescribe: "it" }]
        }
    }
]);
