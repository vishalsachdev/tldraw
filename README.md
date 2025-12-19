# tldraw Canvas for Claude Code

A tldraw canvas application that Claude Code can control programmatically via HTTP API, enabling AI-assisted drawing and visualization.

## Features

- **Programmatic Drawing**: Claude Code sends commands to create shapes, lines, and text
- **Real-time Updates**: WebSocket connection ensures instant canvas updates
- **Full Shape Library**: Rectangles, circles, triangles, stars, freehand curves, arrows, and more
- **Artistic Capabilities**: Support for complex compositions like cityscapes and fractal mandalas

## Quick Start

```bash
# Install dependencies
npm install

# Start everything (bridge server, Vite, and browser)
./start.sh
```

## Architecture

```
Claude Code  ──HTTP:3334──▶  Bridge Server  ◀──WS:3333──  Browser/tldraw
```

- **Port 3334**: HTTP API for Claude to send drawing commands
- **Port 3333**: WebSocket for browser-server communication
- **Port 5174**: Vite development server

## Usage

### Test the Connection

```bash
curl -X POST http://localhost:3334/command \
  -H 'Content-Type: application/json' \
  -d '{"command":"clear","params":{}}'
```

### Draw a House

```bash
curl -X POST http://localhost:3334/command \
  -H 'Content-Type: application/json' \
  -d '{
    "command": "create_shapes",
    "params": {
      "shapes": [
        {"kind": "rectangle", "x": 600, "y": 430, "width": 200, "height": 160},
        {"kind": "triangle", "x": 600, "y": 310, "width": 240, "height": 100},
        {"kind": "rectangle", "x": 600, "y": 480, "width": 40, "height": 70},
        {"kind": "rectangle", "x": 540, "y": 400, "width": 40, "height": 40},
        {"kind": "rectangle", "x": 660, "y": 400, "width": 40, "height": 40}
      ]
    }
  }'
```

## Available Commands

| Command | Description |
|---------|-------------|
| `clear` | Remove all shapes |
| `create_shape` | Create a single shape |
| `create_shapes` | Create multiple shapes (batch) |
| `get_shapes` | List all current shapes |
| `undo` / `redo` | History navigation |
| `zoom_to_fit` | Fit view to content |
| `delete_selected` | Remove selected shapes |

## Shape Types

### Geometric
`rectangle`, `circle`, `ellipse`, `triangle`, `diamond`, `hexagon`, `star`, `cloud`, `pentagon`, `octagon`, `heart`

### Drawing
`draw` / `freehand` - Curves defined by point arrays

### Text
`text` - Labels
`note` - Sticky notes

### Connectors
`arrow` - Arrows with arrowheads
`line` - Simple lines

## Colors

```
black   grey    white
violet  light-violet
blue    light-blue
green   light-green
yellow  orange
red     light-red
```

## Project Structure

```
tldraw/
├── src/
│   ├── App.tsx              # Main React component with tldraw
│   ├── useCanvasBridge.ts   # WebSocket hook for commands
│   └── main.tsx             # Entry point
├── mcp-server/
│   └── index.js             # HTTP + WebSocket bridge
├── start.sh                 # Startup script
├── CLAUDE.md                # Instructions for Claude Code
└── README.md
```

## Development

```bash
npm run dev      # Start Vite dev server only
npm run build    # Production build
npm run lint     # Run ESLint
```

## How It Works

1. `start.sh` launches the bridge server and Vite
2. Browser loads tldraw and connects via WebSocket to port 3333
3. Claude Code sends HTTP POST requests to port 3334
4. Bridge server forwards commands to browser via WebSocket
5. `useCanvasBridge.ts` receives commands and creates shapes using tldraw's API

## License

MIT
