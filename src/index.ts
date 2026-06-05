#!/usr/bin/env node
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
