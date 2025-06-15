import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({
  name: "gmail-mcp-server",
  version: "1.0.0",
  tools: [],
});
  
export default server;