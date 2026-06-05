import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { VehicleService } from "../services/vehicle.service.js";

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
                "Find Star Citizen ships and ground vehicles by name. Returns matches with their id, used by the location tools.",
            inputSchema: {
                query: z.string().describe("Full or partial vehicle name, e.g. 'Constellation'")
            }
        },
        async ({ query }) => {
            const results = await service.search(query);
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

    server.registerTool(
        "find_vehicle_purchase_locations",
        {
            title: "Find where to buy a vehicle",
            description: "List terminals selling a vehicle, cheapest first. Takes a vehicle id from search_vehicles.",
            inputSchema: {
                idVehicle: z.number().describe("Vehicle id from search_vehicles")
            }
        },
        async ({ idVehicle }) => json(await service.findPurchaseLocations(idVehicle))
    );

    server.registerTool(
        "find_vehicle_rental_locations",
        {
            title: "Find where to rent a vehicle",
            description: "List terminals renting a vehicle, cheapest first. Takes a vehicle id from search_vehicles.",
            inputSchema: {
                idVehicle: z.number().describe("Vehicle id from search_vehicles")
            }
        },
        async ({ idVehicle }) => json(await service.findRentalLocations(idVehicle))
    );
}
