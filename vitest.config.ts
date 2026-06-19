import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            include: ["src/**/*.ts"],
            exclude: [
                "src/**/*.test.ts",
                "src/api/**/schema.ts", // generated from OpenAPI spec
                "src/index.ts", // entrypoint wiring
                "src/logging/**" // I/O sink
            ]
        }
    }
});
