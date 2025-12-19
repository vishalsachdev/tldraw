import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { WebSocketServer } from "ws";
import { createServer } from "http";

// Store connected canvas clients
let canvasClient = null;
let pendingRequests = new Map();
let requestId = 0;

// Start WebSocket server for canvas connection
const wss = new WebSocketServer({ port: 3333 });

// HTTP server for direct command API (so Claude can send commands without MCP)
const httpServer = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/command") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { command, params } = JSON.parse(body);
        const result = await sendToCanvas(command, params);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, result }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

httpServer.listen(3334, () => {
  console.error("[MCP] HTTP API running on http://localhost:3334/command");
});

wss.on("connection", (ws) => {
  console.error("[MCP] Canvas connected");
  canvasClient = ws;

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.id && pendingRequests.has(message.id)) {
        const { resolve } = pendingRequests.get(message.id);
        pendingRequests.delete(message.id);
        resolve(message.result);
      }
    } catch (e) {
      console.error("[MCP] Error parsing message:", e);
    }
  });

  ws.on("close", () => {
    console.error("[MCP] Canvas disconnected");
    canvasClient = null;
  });
});

console.error("[MCP] WebSocket server running on ws://localhost:3333");

// Send command to canvas and wait for response
function sendToCanvas(command, params) {
  return new Promise((resolve, reject) => {
    if (!canvasClient) {
      reject(new Error("Canvas not connected. Please open the tldraw app in your browser."));
      return;
    }

    const id = ++requestId;
    pendingRequests.set(id, { resolve, reject });

    canvasClient.send(JSON.stringify({ id, command, params }));

    // Timeout after 10 seconds
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error("Request timed out"));
      }
    }, 10000);
  });
}

// Create MCP server
const server = new Server(
  {
    name: "tldraw-canvas",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "canvas_create_shape",
        description: "Create a shape on the tldraw canvas. Shapes are positioned by center coordinates.",
        inputSchema: {
          type: "object",
          properties: {
            kind: {
              type: "string",
              enum: ["rectangle", "circle", "ellipse", "triangle", "star", "diamond", "hexagon", "cloud", "arrow", "line", "text", "note", "draw", "freehand"],
              description: "Type of shape to create. 'draw' and 'freehand' create hand-drawn strokes using points arrays."
            },
            x: {
              type: "number",
              description: "Center X position (canvas is ~1200px wide, center is 600)"
            },
            y: {
              type: "number",
              description: "Center Y position (canvas is ~800px tall, center is 400)"
            },
            width: {
              type: "number",
              description: "Width of the shape (default: 100)"
            },
            height: {
              type: "number",
              description: "Height of the shape (default: 100)"
            },
            text: {
              type: "string",
              description: "Text content (for text/note shapes)"
            },
            endX: {
              type: "number",
              description: "End X offset for arrows/lines (relative to start)"
            },
            endY: {
              type: "number",
              description: "End Y offset for arrows/lines (relative to start)"
            },
            points: {
              type: "array",
              description: "Array of {x, y} points for draw/freehand shapes (relative to shape origin)",
              items: {
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" },
                  z: { type: "number", description: "Pressure (0-1), default 0.5" }
                }
              }
            },
            color: {
              type: "string",
              enum: ["black", "grey", "light-violet", "violet", "blue", "light-blue", "yellow", "orange", "green", "light-green", "light-red", "red"],
              description: "Color for draw shapes (default: black)"
            },
            size: {
              type: "string",
              enum: ["s", "m", "l", "xl"],
              description: "Stroke size for draw shapes (default: m)"
            },
            isClosed: {
              type: "boolean",
              description: "Whether the draw shape forms a closed path"
            },
            fill: {
              type: "string",
              enum: ["none", "semi", "solid", "pattern"],
              description: "Fill style for closed draw shapes"
            }
          },
          required: ["kind", "x", "y"]
        }
      },
      {
        name: "canvas_create_shapes",
        description: "Create multiple shapes at once on the tldraw canvas. More efficient than creating one at a time.",
        inputSchema: {
          type: "object",
          properties: {
            shapes: {
              type: "array",
              description: "Array of shape objects to create",
              items: {
                type: "object",
                properties: {
                  kind: { type: "string" },
                  x: { type: "number" },
                  y: { type: "number" },
                  width: { type: "number" },
                  height: { type: "number" },
                  text: { type: "string" },
                  endX: { type: "number" },
                  endY: { type: "number" },
                  points: { type: "array", items: { type: "object" } },
                  color: { type: "string" },
                  size: { type: "string" },
                  isClosed: { type: "boolean" },
                  fill: { type: "string" }
                },
                required: ["kind", "x", "y"]
              }
            }
          },
          required: ["shapes"]
        }
      },
      {
        name: "canvas_clear",
        description: "Clear all shapes from the canvas",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "canvas_get_shapes",
        description: "Get all shapes currently on the canvas with their properties",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "canvas_undo",
        description: "Undo the last action on the canvas",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "canvas_redo",
        description: "Redo the last undone action on the canvas",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "canvas_zoom_to_fit",
        description: "Zoom the canvas to fit all shapes in view",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "canvas_delete_selected",
        description: "Delete currently selected shapes",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case "canvas_create_shape":
        result = await sendToCanvas("create_shape", args);
        break;

      case "canvas_create_shapes":
        result = await sendToCanvas("create_shapes", args);
        break;

      case "canvas_clear":
        result = await sendToCanvas("clear", {});
        break;

      case "canvas_get_shapes":
        result = await sendToCanvas("get_shapes", {});
        break;

      case "canvas_undo":
        result = await sendToCanvas("undo", {});
        break;

      case "canvas_redo":
        result = await sendToCanvas("redo", {});
        break;

      case "canvas_zoom_to_fit":
        result = await sendToCanvas("zoom_to_fit", {});
        break;

      case "canvas_delete_selected":
        result = await sendToCanvas("delete_selected", {});
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: typeof result === "string" ? result : JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[MCP] tldraw canvas server running");
}

main().catch(console.error);
