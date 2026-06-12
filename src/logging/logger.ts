import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Small, extensible logger for the MCP server.
 *
 * Two delivery channels, fed from one call site:
 *   1. stderr (always). stdout is reserved for the JSON-RPC stream, so logs
 *      must never go there. Gated by the LOG_LEVEL env var (default "info").
 *   2. the MCP client, via notifications/message, once a server is attached.
 *      The SDK drops messages below the level the client set with
 *      logging/setLevel, so we forward everything and let it decide.
 *
 * Extensibility: delivery is a list of sinks. Add another (e.g. a rotating
 * file) with addSink() without changing any call site. Levels are the eight
 * RFC 5424 severities the protocol uses.
 */

export type LogLevel = "debug" | "info" | "warning" | "error" | "critical";

// RFC 5424 ordering, used only for the stderr threshold.
const SEVERITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warning: 2,
    error: 3,
    critical: 4
};

export interface LogRecord {
    level: LogLevel;
    logger: string;
    data: Record<string, unknown>;
}

export type Sink = (record: LogRecord) => void;

function stderrSink(): Sink {
    const min = SEVERITY[process.env.LOG_LEVEL as LogLevel] ?? SEVERITY.info;
    return (r) => {
        if (SEVERITY[r.level] < min) return;
        process.stderr.write(JSON.stringify({ ts: new Date().toISOString(), ...r }) + "\n");
    };
}

class Hub {
    private sinks: Sink[] = [stderrSink()];

    addSink(sink: Sink): void {
        this.sinks.push(sink);
    }

    emit(record: LogRecord): void {
        for (const sink of this.sinks) {
            // Logging must never break the server.
            try {
                sink(record);
            } catch {
                // ignored
            }
        }
    }
}

const hub = new Hub();

/** Register an extra sink (for example a rotating file) at startup. */
export function addSink(sink: Sink): void {
    hub.addSink(sink);
}

/**
 * Deliver logs to the connected MCP client. Call once, after the server has
 * connected to its transport. The SDK filters by the client's level and
 * no-ops if no client is attached, so this is fire-and-forget.
 */
export function attachMcpServer(server: McpServer): void {
    hub.addSink((r) => {
        void server.sendLoggingMessage({ level: r.level, logger: r.logger, data: r.data }).catch(() => {
            // a transport hiccup must not surface as a logging failure
        });
    });
}

export interface Logger {
    log(level: LogLevel, data: Record<string, unknown>): void;
    debug(data: Record<string, unknown>): void;
    info(data: Record<string, unknown>): void;
    warning(data: Record<string, unknown>): void;
    error(data: Record<string, unknown>): void;
}

/** Create a named logger for a component. Names should be stable and consistent. */
export function createLogger(name: string): Logger {
    const at =
        (level: LogLevel) =>
        (data: Record<string, unknown>): void =>
            hub.emit({ level, logger: name, data });
    return {
        log: (level, data) => hub.emit({ level, logger: name, data }),
        debug: at("debug"),
        info: at("info"),
        warning: at("warning"),
        error: at("error")
    };
}
