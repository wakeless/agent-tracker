#!/usr/bin/env node
/**
 * Agent Tracker MCP Server
 * Provides tools for Claude agents to communicate work summaries
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
/**
 * Create and configure the MCP server
 */
const server = new Server({
    name: 'agent-tracker',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'set_work_summary',
                description: 'Set a 5-7 word summary describing the current work being performed. ' +
                    'REQUIRED: Call this proactively when starting new work or when the direction of work changes significantly. ' +
                    'Examples: "Implementing user authentication system", "Fixing database connection timeout issues", "Refactoring payment processing code"',
                inputSchema: {
                    type: 'object',
                    properties: {
                        summary: {
                            type: 'string',
                            description: 'A 5-7 word summary of the current work (e.g., "Implementing user authentication system")',
                        },
                    },
                    required: ['summary'],
                },
            },
        ],
    };
});
/**
 * Handler for tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'set_work_summary') {
        const { summary } = request.params.arguments;
        // Simple validation
        if (!summary || typeof summary !== 'string') {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Error: summary parameter is required and must be a string',
                    },
                ],
                isError: true,
            };
        }
        // Return acknowledgment
        return {
            content: [
                {
                    type: 'text',
                    text: `Work summary set: "${summary}"`,
                },
            ],
        };
    }
    // Unknown tool
    return {
        content: [
            {
                type: 'text',
                text: `Unknown tool: ${request.params.name}`,
            },
        ],
        isError: true,
    };
});
/**
 * Start the server with stdio transport
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Log to stderr so it doesn't interfere with stdio protocol
    console.error('Agent Tracker MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map