import OpenAI from 'openai'
import { Editor, createShapeId, TLShapePartial, toRichText } from 'tldraw'

// Types for LLM-generated operations
interface ShapeOperation {
  type: 'create_shape'
  shape: {
    kind: 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'star' | 'diamond' | 'hexagon' | 'cloud' | 'arrow' | 'line' | 'text' | 'note' | 'frame'
    x: number
    y: number
    width?: number
    height?: number
    text?: string
    // For arrows/lines
    endX?: number
    endY?: number
  }
}

interface ActionOperation {
  type: 'action'
  action: 'clear' | 'undo' | 'redo' | 'select_all' | 'delete_selected' | 'zoom_to_fit'
}

interface LLMResponse {
  operations: (ShapeOperation | ActionOperation)[]
  message: string
}

const SYSTEM_PROMPT = `You are an expert canvas drawing assistant that creates visual compositions from natural language. You think spatially and create well-proportioned, recognizable drawings.

## CANVAS SPECS
- Dimensions: 1200x800 pixels
- Center: (600, 400)
- Safe drawing area: x: 100-1100, y: 100-700
- Coordinate system: (0,0) is top-left, x increases right, y increases DOWN

## AVAILABLE SHAPES

### Geometric Primitives
- rectangle: boxes, walls, bodies, buildings, screens
- circle: heads, wheels, suns, balls, eyes, dots
- ellipse: ovals, stretched circles, faces
- triangle: roofs, arrows, mountains, trees (with rectangle trunk)
- diamond: decision nodes, decorative elements
- hexagon: nuts, bolts, honeycomb cells
- star: ratings, decorations, emphasis
- cloud: thought bubbles, weather, cloud storage icons

### Connectors & Lines
- arrow: connects shapes, shows flow/direction. Use endX/endY relative to start position
  - Right arrow: endX: 100, endY: 0
  - Down arrow: endX: 0, endY: 100
  - Diagonal: endX: 100, endY: 100
- line: same as arrow but no arrowhead

### Text Elements
- text: labels, titles (provide "text" field)
- note: sticky notes with text (yellow background)
- frame: container/group with title

## JSON OUTPUT FORMAT
{
  "operations": [
    {"type": "create_shape", "shape": {"kind": "...", "x": N, "y": N, "width": N, "height": N}},
    {"type": "create_shape", "shape": {"kind": "text", "x": N, "y": N, "text": "..."}},
    {"type": "create_shape", "shape": {"kind": "arrow", "x": N, "y": N, "endX": N, "endY": N}}
  ],
  "message": "description"
}

## SPATIAL REASONING GUIDELINES

### Positioning
- Place related shapes close together
- Keep consistent spacing (50-100px gaps typically work well)
- For rows: increment x by (shape_width + gap)
- For columns: increment y by (shape_height + gap)
- Center compositions around (600, 400) unless specified otherwise

### Scale & Proportion
- Small icons/details: 30-50px
- Normal elements: 80-150px
- Large/main elements: 200-300px
- Keep relative proportions logical (heads smaller than bodies, wheels smaller than cars)

### Connecting Shapes with Arrows
- Start arrow at the edge of source shape
- Point endX/endY toward target shape
- For flowcharts: source_x + source_width/2 → target_x - target_width/2

## COMPOSITION EXAMPLES (with coordinates)

### Face/Emoji (centered at 600, 400)
CRITICAL: Eyes and mouth go INSIDE the head circle, not outside!
- Head: circle at (600, 400), size 250x250
- Left eye: circle at (550, 360), size 40x40  ← INSIDE head, upper-left area
- Right eye: circle at (650, 360), size 40x40 ← INSIDE head, upper-right area
- Mouth: ellipse at (600, 460), size 80x30   ← INSIDE head, lower area
The eyes are ~50px left/right of center, ~40px ABOVE center
The mouth is ~60px BELOW center

### Flowchart (3 boxes horizontal)
- Box 1: rectangle at (250, 400), size 150x80
- Arrow 1: at (325, 400), endX: 100, endY: 0
- Box 2: rectangle at (500, 400), size 150x80
- Arrow 2: at (575, 400), endX: 100, endY: 0
- Box 3: rectangle at (750, 400), size 150x80

### House (centered at 600, 400)
- Walls: rectangle at (600, 420), size 200x160
- Roof: triangle at (600, 300), size 240x100   ← positioned ABOVE walls
- Door: rectangle at (600, 470), size 40x70    ← INSIDE walls, bottom center
- Window left: rectangle at (540, 380), size 40x40  ← INSIDE walls
- Window right: rectangle at (660, 380), size 40x40 ← INSIDE walls

### Tree
- Small rectangle trunk at bottom
- Large circle or triangle for foliage on top

### Car (side view)
- Large rectangle for body
- Two circles below for wheels
- Smaller rectangle on top for cabin

### Person (stick figure)
- Circle for head at top
- Rectangle for body below head
- Lines or thin rectangles for arms and legs

### Solar System
- Large circle (sun) in center or left
- Progressively smaller circles at increasing distances
- Optional: text labels near each planet

### Org Chart / Hierarchy
- Boxes arranged in rows
- Top row: 1 box (root)
- Connect parent to children with arrows pointing down

## IMPORTANT RULES
1. Always output valid JSON
2. Be generous with shapes - more detail is better
3. Think about what shapes COMBINE to form the requested object
4. Use text labels to clarify ambiguous drawings
5. For abstract concepts, use common visual metaphors (lightbulb=idea, heart=love, etc.)
6. When asked for "N things in a row/column", calculate positions mathematically for even spacing
7. Layer shapes logically - background elements first if needed`

export async function interpretCommand(
  apiKey: string,
  userCommand: string
): Promise<LLMResponse> {
  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true, // Required for client-side usage
  })

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userCommand },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2000,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from LLM')
  }

  return JSON.parse(content) as LLMResponse
}

// Execute the LLM response operations on the editor
export function executeOperations(
  editor: Editor,
  response: LLMResponse
): { success: boolean; message: string } {
  try {
    for (const op of response.operations) {
      if (op.type === 'action') {
        executeAction(editor, op.action)
      } else if (op.type === 'create_shape') {
        createShape(editor, op.shape)
      }
    }
    return { success: true, message: response.message }
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

function executeAction(editor: Editor, action: string) {
  const normalizedAction = action.toLowerCase().replace(/[_\s-]/g, '')

  if (normalizedAction.includes('clear') || normalizedAction.includes('reset') || normalizedAction.includes('deleteall')) {
    const shapes = editor.getCurrentPageShapes()
    if (shapes.length > 0) {
      editor.deleteShapes(shapes.map((s) => s.id))
    }
  } else if (normalizedAction === 'undo') {
    editor.undo()
  } else if (normalizedAction === 'redo') {
    editor.redo()
  } else if (normalizedAction.includes('selectall')) {
    editor.selectAll()
  } else if (normalizedAction.includes('delete') && normalizedAction.includes('selected')) {
    const selected = editor.getSelectedShapes()
    if (selected.length > 0) {
      editor.deleteShapes(selected.map((s) => s.id))
    }
  } else if (normalizedAction.includes('zoom') || normalizedAction.includes('fit')) {
    editor.zoomToFit()
  }
}

function createShape(editor: Editor, shape: ShapeOperation['shape']) {
  const shapeId = createShapeId()
  const width = shape.width ?? 100
  const height = shape.height ?? 100

  let shapePartial: TLShapePartial

  switch (shape.kind) {
    case 'rectangle':
      shapePartial = {
        id: shapeId,
        type: 'geo',
        x: shape.x - width / 2,
        y: shape.y - height / 2,
        props: { geo: 'rectangle', w: width, h: height },
      }
      break

    case 'circle':
      shapePartial = {
        id: shapeId,
        type: 'geo',
        x: shape.x - width / 2,
        y: shape.y - width / 2,
        props: { geo: 'ellipse', w: width, h: width },
      }
      break

    case 'ellipse':
      shapePartial = {
        id: shapeId,
        type: 'geo',
        x: shape.x - width / 2,
        y: shape.y - height / 2,
        props: { geo: 'ellipse', w: width, h: height },
      }
      break

    case 'triangle':
      shapePartial = {
        id: shapeId,
        type: 'geo',
        x: shape.x - width / 2,
        y: shape.y - height / 2,
        props: { geo: 'triangle', w: width, h: height },
      }
      break

    case 'star':
      shapePartial = {
        id: shapeId,
        type: 'geo',
        x: shape.x - width / 2,
        y: shape.y - height / 2,
        props: { geo: 'star', w: width, h: height },
      }
      break

    case 'diamond':
      shapePartial = {
        id: shapeId,
        type: 'geo',
        x: shape.x - width / 2,
        y: shape.y - height / 2,
        props: { geo: 'diamond', w: width, h: height },
      }
      break

    case 'hexagon':
      shapePartial = {
        id: shapeId,
        type: 'geo',
        x: shape.x - width / 2,
        y: shape.y - height / 2,
        props: { geo: 'hexagon', w: width, h: height },
      }
      break

    case 'cloud':
      shapePartial = {
        id: shapeId,
        type: 'geo',
        x: shape.x - width / 2,
        y: shape.y - height / 2,
        props: { geo: 'cloud', w: width, h: height },
      }
      break

    case 'text':
      shapePartial = {
        id: shapeId,
        type: 'text',
        x: shape.x,
        y: shape.y,
        props: { richText: toRichText(shape.text ?? 'Text') },
      }
      break

    case 'note':
      shapePartial = {
        id: shapeId,
        type: 'note',
        x: shape.x - (width / 2),
        y: shape.y - (height / 2),
        props: { richText: toRichText(shape.text ?? 'Note') },
      }
      break

    case 'frame':
      shapePartial = {
        id: shapeId,
        type: 'frame',
        x: shape.x - width / 2,
        y: shape.y - height / 2,
        props: { w: Math.max(width, 200), h: Math.max(height, 150), name: shape.text ?? 'Frame' },
      }
      break

    case 'arrow':
      shapePartial = {
        id: shapeId,
        type: 'arrow',
        x: shape.x,
        y: shape.y,
        props: {
          start: { x: 0, y: 0 },
          end: { x: shape.endX ?? 100, y: shape.endY ?? 0 },
        },
      }
      break

    case 'line':
      shapePartial = {
        id: shapeId,
        type: 'line',
        x: shape.x,
        y: shape.y,
        props: {
          points: {
            a1: { id: 'a1', index: 'a1', x: 0, y: 0 },
            a2: { id: 'a2', index: 'a2', x: shape.endX ?? 100, y: shape.endY ?? 0 },
          },
        },
      }
      break

    default:
      return
  }

  editor.createShape(shapePartial)
}
