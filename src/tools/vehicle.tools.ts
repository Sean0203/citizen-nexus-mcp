import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { VehicleService } from "../services/vehicle.service.js";
import { createLogger } from "../logging/logger.js";

const log = createLogger("vehicle.tools");

function json(data: unknown) {
    return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }]
    };
}

export function registerVehicleTools(server: McpServer, service: VehicleService): void {
    server.registerTool(
        "search_vehicles",
        {
            title: "Search vehicles",
            description:
                "Find Star Citizen ships and ground vehicles by name. Returns matching vehicles with key " +
                "details (manufacturer, classification, crew, cargo, quantum travel) and any in-game purchase " +
                "or rental listings (terminals, locations, UEC prices).",
            inputSchema: {
                query: z.string().describe("Full or partial vehicle name, e.g. 'Constellation'")
            }
        },
        async ({ query }) => {
            const results = await service.searchVehicles(query);
            log.info({ event: "search_vehicles", query, results_returned: results.length });
            if (results.length === 0)
                return {
                    content: [
                        {
                            type: "text",
                            text: `No vehicles matched "${query}".`
                        }
                    ]
                };
            return json(results);
        }
    );
}
