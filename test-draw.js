// Run this AFTER refreshing the browser
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3333');

ws.on('error', (e) => {
  console.error('Connection failed:', e.message);
  process.exit(1);
});

ws.on('open', () => {
  console.log('Sending commands to canvas...');

  // The MCP server forwards this to the browser
  // But we're connecting AS a client, not as the MCP server
  // This won't work because we become canvasClient

  // Instead, just verify connection works
  console.log('Connected to MCP WebSocket server');
  console.log('');
  console.log('To draw on canvas, you need to either:');
  console.log('1. Use the text input in the app');
  console.log('2. Restart Claude Code to get MCP tools');
  ws.close();
});

setTimeout(() => process.exit(0), 3000);
