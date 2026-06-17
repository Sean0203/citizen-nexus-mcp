import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ApiError } from "../api/http.js";
import { createLogger } from "../logging/logger.js";

const log = createLogger("tools");

/** Wrap arbitrary data as a JSON tool result. Compact (no pretty-printing) to
 *  keep the token cost low for the consuming model. */
export function json(data: unknown): CallToolResult {
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
}

/** Build a plain-text tool result, optionally flagged as an error. */
export function text(message: string, isError = false): CallToolResult {
    return { content: [{ type: "text", text: message }], isError };
}

type ToolHandler<A> = (args: A) => Promise<CallToolResult>;

/**
 * Wrap a tool handler so failures become clean tool errors instead of raw throws.
 * An ApiError is expected and its message is actionable, so it is returned verbatim.
 * Any other error is an unexpected bug: it is logged and replaced with a generic
 * message so internal details never reach the model.
 */
export function withToolErrorHandling<A>(toolName: string, handler: ToolHandler<A>): ToolHandler<A> {
    return async (args: A): Promise<CallToolResult> => {
        try {
            return await handler(args);
        } catch (err) {
            if (err instanceof ApiError) return text(err.message, true);
            log.error({ event: "tool_error", tool: toolName, error: String(err) });
            return text(`Internal error in ${toolName}.`, true);
        }
    };
}
