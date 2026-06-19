import { describe, expect, it, vi } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { VehicleService } from "../services/vehicle.service.js";
import type { VehicleWiki } from "../domain/wiki-vehicle.models.js";
import { ApiError } from "../api/http.js";
import { registerVehicleTools } from "./vehicle.tools.js";

type Handler = (args: { query: string }) => Promise<CallToolResult>;

// Fake McpServer that captures the registered tool name and handler.
function setup(searchImpl: (query: string) => Promise<VehicleWiki[]>) {
    let captured: { name: string; handler: Handler } | undefined;
    const registerTool = vi.fn((name: string, _config: unknown, handler: Handler) => {
        captured = { name, handler };
    });
    const server = { registerTool } as unknown as McpServer;
    const service = { searchVehicles: vi.fn(searchImpl) } as unknown as VehicleService;

    registerVehicleTools(server, service);
    if (!captured) throw new Error("tool was not registered");
    return { registerTool, ...captured };
}

const textOf = (r: CallToolResult) => (r.content[0] as { text: string }).text;

describe("registerVehicleTools", () => {
    it("should register the search_vehicles tool", () => {
        const { name, registerTool } = setup(async () => []);
        expect(name).toBe("search_vehicles");
        expect(registerTool).toHaveBeenCalledOnce();
    });

    it("should return results as compact JSON", async () => {
        const results = [{ slug: "avenger" }] as unknown as VehicleWiki[];
        const { handler } = setup(async () => results);

        const out = await handler({ query: "avenger" });

        expect(textOf(out)).toBe(JSON.stringify(results)); // compact, no indentation
        expect(textOf(out)).not.toContain("\n");
        expect(out.isError).toBeFalsy();
    });

    it("should return a friendly message when nothing matches", async () => {
        const { handler } = setup(async () => []);

        const out = await handler({ query: "zzz" });

        expect(textOf(out)).toBe('No vehicles matched "zzz".');
        expect(out.isError).toBeFalsy();
    });

    it("should surface an ApiError's message as a tool error", async () => {
        const { handler } = setup(async () => {
            throw new ApiError("the wiki API timed out after 15000ms");
        });

        const out = await handler({ query: "x" });

        expect(out.isError).toBe(true);
        expect(textOf(out)).toContain("timed out");
    });

    it("should replace an unexpected error with a generic message", async () => {
        const { handler } = setup(async () => {
            throw new TypeError("cannot read property of undefined");
        });

        const out = await handler({ query: "x" });

        expect(out.isError).toBe(true);
        expect(textOf(out)).toBe("Internal error in search_vehicles.");
        expect(textOf(out)).not.toContain("undefined"); // internals not leaked
    });
});
