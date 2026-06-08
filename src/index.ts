#!/usr/bin/env node
// Load a local .env if present. This is a dev convenience only: dotenv does NOT
// override variables already in process.env, so values injected by an MCP client
// config always win. Resolved relative to this file (one level up from dist/ or
// src/), not cwd, because an MCP client may spawn the server from any directory.
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

loadEnv({ path: join(dirname(fileURLToPath(import.meta.url)), "../.env"), quiet: true });

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createContainer } from "./container.js";
import { registerVehicleTools } from "./tools/vehicles.js";

const server = new McpServer({ name: "uex-mcp", version: "0.1.0" });
const container = createContainer();

registerVehicleTools(server, container.vehicleService);

async function main(): Promise<void> {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // stdout is reserved for JSON-RPC. Log only to stderr.
    console.error("[uex-mcp] ready (stdio)");
}

main().catch((err) => {
    console.error("[uex-mcp] fatal:", err);
    process.exit(1);
});
