#!/bin/bash
# Start tldraw canvas with Claude bridge

cd /Users/vishal/code/tldraw

# Kill any existing processes on our ports
lsof -ti:3333 -ti:3334 | xargs kill -9 2>/dev/null

# Start MCP bridge server (WebSocket + HTTP)
echo "Starting MCP bridge..."
node mcp-server/index.js &
sleep 1

# Start Vite dev server
echo "Starting Vite..."
npm run dev &
sleep 3

# Open browser
echo "Opening browser..."
open -a "Google Chrome" http://localhost:5174

echo ""
echo "Ready! Claude can now draw via HTTP API on :3334"
echo "To test: curl -X POST http://localhost:3334/command -H 'Content-Type: application/json' -d '{\"command\":\"clear\",\"params\":{}}'"
