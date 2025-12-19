# tldraw Canvas Control Skill for Claude Code

A skill that enables Claude Code to programmatically draw on a tldraw canvas via HTTP API. This creates a visual feedback loop where Claude can create diagrams, illustrations, and art through natural language commands.

## Architecture

```
┌─────────────────┐     HTTP :3334      ┌──────────────────┐     WebSocket :3333     ┌─────────────────┐
│   Claude Code   │ ─────────────────→  │   Bridge Server  │  ←─────────────────────  │  Browser/tldraw │
│                 │     (commands)      │   (Node.js)      │      (bidirectional)    │   React App     │
└─────────────────┘                     └──────────────────┘                         └─────────────────┘
```

## Available Commands

| Command | Description |
|---------|-------------|
| `clear` | Remove all shapes from canvas |
| `create_shape` | Create a single shape |
| `create_shapes` | Create multiple shapes (batch) |
| `get_shapes` | List all current shapes |
| `undo` / `redo` | History navigation |
| `zoom_to_fit` | Fit view to content |
| `delete_selected` | Remove selection |

## Shape Types

### Geometric Shapes (geo)
```javascript
{ kind: 'rectangle', x: 600, y: 400, width: 100, height: 100 }
{ kind: 'circle', x: 600, y: 400, width: 100, height: 100 }
{ kind: 'triangle', x: 600, y: 400, width: 100, height: 100 }
{ kind: 'diamond', x: 600, y: 400, width: 100, height: 100 }
{ kind: 'star', x: 600, y: 400, width: 100, height: 100 }
// Also: ellipse, hexagon, cloud, pentagon, octagon, heart
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

### Text & Connectors
```javascript
{ kind: 'text', x: 600, y: 400, text: 'Hello World' }
{ kind: 'note', x: 600, y: 400, text: 'Sticky note content' }
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

## Critical Learning: Draw Shape Behavior

**tldraw interpolates smooth curves through points, NOT straight lines!**

This means:
- `isClosed: true` creates **organic, loopy shapes** (ovals, blobs), NOT angular polygons
- Simple point arrays like `[{x:0,y:-20}, {x:20,y:0}, {x:0,y:20}, {x:-20,y:0}]` become twisted loops, not diamonds

### Use the Right Tool

| Shape Wanted | Use This | NOT This |
|--------------|----------|----------|
| Diamond/rhombus | `kind: 'diamond'` (geo) | draw points with 4 corners |
| Triangle | `kind: 'triangle'` (geo) | draw points with 3 corners |
| Rectangle | `kind: 'rectangle'` (geo) | draw points with 4 corners |
| Accent dots | `kind: 'circle'` (geo) | small draw shapes |
| Organic petals | draw with 20+ points | few-point closed path |
| Straight lines | draw with 2 points, `isClosed: false` | - |
| Smooth curves | draw with many points along arc | few points |

### When Draw Shapes Work Well

- **Open paths** (lines, curves) with `isClosed: false`
- **Organic shapes** with many points (20+) defining the exact curve
- **Spirals, waves, and smooth curves** generated mathematically

## Mathematical Shape Functions

### Spiral
```javascript
function spiral(turns, startR, endR, steps = 35) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * Math.PI * 2 * turns;
    const r = startR + (endR - startR) * t;
    points.push({
      x: Math.round(Math.cos(a) * r),
      y: Math.round(Math.sin(a) * r)
    });
  }
  return points;
}
```

### Circle (Smooth)
```javascript
function circle(radius, steps = 32) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    });
  }
  return points;
}
```

### Wave
```javascript
function wave(length, amplitude, frequency) {
  const points = [];
  for (let i = 0; i <= 100; i++) {
    points.push({
      x: i * (length / 100),
      y: Math.sin(i * frequency) * amplitude
    });
  }
  return points;
}
```

### Arc
```javascript
function arc(startAngle, span, radius, steps = 20) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = startAngle + span * t;
    points.push({
      x: Math.round(Math.cos(a) * radius),
      y: Math.round(Math.sin(a) * radius)
    });
  }
  return points;
}
```

## Example: Simple House

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

## Example: Fractal Mandala Pattern

For symmetric patterns, use N-fold rotational symmetry:

```javascript
const SYMMETRY = 8;
const angleStep = (Math.PI * 2) / SYMMETRY;
const cx = 600, cy = 400; // Canvas center

const shapes = [];

// Create 8 diamonds radiating from center
for (let i = 0; i < SYMMETRY; i++) {
  const angle = i * angleStep;
  const dist = 100;
  shapes.push({
    kind: 'diamond',
    x: cx + Math.cos(angle) * dist,
    y: cy + Math.sin(angle) * dist,
    width: 30,
    height: 50,
    color: 'violet'
  });
}

// Create connecting lines
for (let i = 0; i < SYMMETRY; i++) {
  const angle = i * angleStep;
  shapes.push({
    kind: 'draw',
    x: cx, y: cy,
    points: [
      { x: 0, y: 0 },
      { x: Math.cos(angle) * 80, y: Math.sin(angle) * 80 }
    ],
    color: 'light-violet',
    size: 's'
  });
}
```

## Best Practices

1. **Use `create_shapes`** for multiple shapes - more efficient than individual calls
2. **Clear before complex drawings** - start fresh for new compositions
3. **Use geo shapes for geometry** - diamonds, triangles, circles render cleanly
4. **Use draw shapes for organic forms** - spirals, waves, custom curves
5. **Generate points mathematically** - use functions for smooth curves (20+ points)
6. **Request visual feedback** - ask user to share screenshot to verify results
7. **Think in composition** - break complex objects into primitive shapes
8. **Batch by layer** - create background elements first, then foreground

## Aesthetic Guidelines

### Color Palettes
- **Violet/Orange**: `violet`, `light-violet`, `orange` (accent sparingly)
- **Cool**: `blue`, `light-blue`, `green`
- **Warm**: `red`, `orange`, `yellow`
- **Sunset gradient**: `violet` → `light-violet` → `light-red` → `orange` → `yellow`

### Composition Tips
- **Interleave layers** - offset alternating rings by `angleStep/2` for mandalas
- **Scale consistently** - each ring ~1.5-2x the radius of previous
- **Accent sparingly** - bright colors on ~20% of elements max
- **Self-similarity** - repeat motifs at multiple scales for fractal feel

---

*This skill was developed through iterative experimentation with Claude Code, learning from visual feedback about how tldraw renders different shape types.*
