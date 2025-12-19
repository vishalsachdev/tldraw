# tldraw Canvas Control Project

This is a tldraw canvas application with Claude Code integration, allowing Claude to programmatically draw shapes via HTTP API commands.

## Quick Start

```bash
./start.sh
```

This starts the MCP bridge server, Vite dev server, and opens Chrome.

## Architecture

```
┌─────────────────┐     HTTP :3334      ┌──────────────────┐     WebSocket :3333     ┌─────────────────┐
│   Claude Code   │ ─────────────────→  │   Bridge Server  │  ←─────────────────────  │  Browser/tldraw │
│                 │     (commands)      │  mcp-server/     │      (bidirectional)    │  React App      │
└─────────────────┘                     └──────────────────┘                         └─────────────────┘
```

- **HTTP API** (port 3334): Claude sends drawing commands here
- **WebSocket** (port 3333): Browser connects here for real-time updates
- **Vite** (port 5174): Development server for React app

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main React component with tldraw canvas |
| `src/useCanvasBridge.ts` | WebSocket hook handling shape creation commands |
| `mcp-server/index.js` | HTTP + WebSocket bridge server |
| `start.sh` | Startup script for all services |

## Drawing Commands

Send POST requests to `http://localhost:3334/command`:

```bash
# Clear canvas
curl -X POST http://localhost:3334/command \
  -H 'Content-Type: application/json' \
  -d '{"command":"clear","params":{}}'

# Create shapes
curl -X POST http://localhost:3334/command \
  -H 'Content-Type: application/json' \
  -d '{"command":"create_shapes","params":{"shapes":[...]}}'
```

### Available Commands

- `clear` - Delete all shapes
- `create_shape` - Create single shape
- `create_shapes` - Create multiple shapes (preferred)
- `get_shapes` - List current shapes
- `undo` / `redo` - History navigation
- `zoom_to_fit` - Fit view to content
- `delete_selected` - Remove selection

## Shape Types

### Geometric Shapes (geo)
```javascript
{ kind: 'rectangle', x: 600, y: 400, width: 100, height: 100 }
{ kind: 'circle', x: 600, y: 400, width: 100, height: 100 }
{ kind: 'triangle', x: 600, y: 400, width: 100, height: 100 }
{ kind: 'star', x: 600, y: 400, width: 100, height: 100 }
// Also: ellipse, diamond, hexagon, cloud, pentagon, octagon, heart
```

### Freehand/Draw Shapes
```javascript
{
  kind: 'draw',
  x: 500, y: 300,           // Origin point
  points: [                  // Relative to origin
    { x: 0, y: 0 },
    { x: 100, y: 50 },
    { x: 200, y: 0 }
  ],
  color: 'violet',          // See colors below
  size: 'm',                // s, m, l, xl
  isClosed: true,           // Connect last to first
  fill: 'solid'             // none, semi, solid, pattern
}
```

### Text & Notes
```javascript
{ kind: 'text', x: 600, y: 400, text: 'Hello' }
{ kind: 'note', x: 600, y: 400, text: 'Sticky note' }
```

### Arrows & Lines
```javascript
{ kind: 'arrow', x: 400, y: 400, endX: 200, endY: 0 }
{ kind: 'line', x: 400, y: 400, endX: 200, endY: 100 }
```

## Colors

```
black, grey, white
violet, light-violet
blue, light-blue
green, light-green
yellow, orange
red, light-red
```

## Coordinate System

- Canvas is approximately 1200x800 pixels
- (0, 0) is top-left
- (600, 400) is center
- Y increases downward
- Draw shape points are relative to shape origin

## Important Techniques

### Solid Fill Workaround

Draw shapes with `fill: 'solid'` create curved blobs, not clean rectangles. Use line stacking instead:

```javascript
// Vertical lines for solid silhouettes
for (let x = left; x < right; x += 4) {
  shapes.push({
    kind: 'draw', x, y: bottom,
    points: [{x:0,y:0}, {x:0,y:-height}],
    color: 'black', size: 'm'
  })
}

// Horizontal lines for gradients
for (let y = top; y < bottom; y += 12) {
  shapes.push({
    kind: 'draw', x: 0, y,
    points: [{x:0,y:0}, {x:width,y:0}],
    color: color, size: 'xl'
  })
}
```

### Smooth Circles

Use many points (32+) for clean curves:
```javascript
const points = Array.from({length: 33}, (_, i) => ({
  x: Math.cos(i/32 * Math.PI * 2) * radius,
  y: Math.sin(i/32 * Math.PI * 2) * radius
}))
```

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server only
npm run build        # Production build
npm run lint         # Run ESLint
```

## Artistic Guidelines

When creating complex drawings:

1. **Less is more** - Over-optimization kills soul. 278 shapes can have more impact than 374.
2. **Use batch creates** - `create_shapes` is more efficient than multiple `create_shape` calls
3. **Check canvas state** - Use `get_shapes` if unsure what's there
4. **Clear before complex drawings** - Start fresh for new compositions
5. **Think in composition** - Break complex objects into primitive shapes

## Skill Files

Detailed techniques are documented in `~/.claude/skills/`:
- `tldraw-canvas.md` - Main reference
- `tldraw-deep-knowledge.md` - Comprehensive architecture
- `tldraw-quick-reference.md` - Cheatsheet
- `tldraw-fractal-aesthetic.md` - Mandala design system
- `tldraw-skyline-aesthetic.md` - Cityscape techniques

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Commands not working | Check bridge is running: `curl http://localhost:3334/command -X POST -H 'Content-Type: application/json' -d '{"command":"clear","params":{}}'` |
| Shapes not appearing | Ensure browser is connected to WebSocket (check console) |
| Port conflict | Kill existing: `lsof -ti:3333 -ti:3334 | xargs kill -9` |
| Code changes not reflected | Reload browser after editing `useCanvasBridge.ts` |
