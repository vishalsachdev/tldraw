import { Editor, createShapeId, TLShapePartial } from 'tldraw'

type CommandResult = {
  success: boolean
  message: string
}

// Parse position from text
function parsePosition(text: string, editor: Editor): { x: number; y: number } {
  const viewport = editor.getViewportScreenBounds()
  const centerX = viewport.width / 2
  const centerY = viewport.height / 2

  let x = centerX
  let y = centerY

  const lowerText = text.toLowerCase()

  if (lowerText.includes('left')) x = centerX - 200
  if (lowerText.includes('right')) x = centerX + 200
  if (lowerText.includes('top')) y = centerY - 150
  if (lowerText.includes('bottom')) y = centerY + 150
  if (lowerText.includes('center') || lowerText.includes('middle')) {
    x = centerX
    y = centerY
  }

  // Parse explicit coordinates like "at 100, 200" or "at (100, 200)"
  const coordMatch = text.match(/at\s*\(?(\d+)\s*,\s*(\d+)\)?/i)
  if (coordMatch) {
    x = parseInt(coordMatch[1], 10)
    y = parseInt(coordMatch[2], 10)
  }

  return { x, y }
}

// Parse size from text
function parseSize(text: string): { w: number; h: number } {
  const lowerText = text.toLowerCase()

  // Check for size keywords
  if (lowerText.includes('tiny')) return { w: 50, h: 50 }
  if (lowerText.includes('small')) return { w: 100, h: 100 }
  if (lowerText.includes('medium')) return { w: 200, h: 200 }
  if (lowerText.includes('large') || lowerText.includes('big')) return { w: 300, h: 300 }
  if (lowerText.includes('huge') || lowerText.includes('giant')) return { w: 400, h: 400 }

  // Parse explicit dimensions like "200x150" or "200 by 150"
  const dimMatch = text.match(/(\d+)\s*(?:x|by)\s*(\d+)/i)
  if (dimMatch) {
    return { w: parseInt(dimMatch[1], 10), h: parseInt(dimMatch[2], 10) }
  }

  // Parse single size like "size 200"
  const sizeMatch = text.match(/size\s*(\d+)/i)
  if (sizeMatch) {
    const size = parseInt(sizeMatch[1], 10)
    return { w: size, h: size }
  }

  return { w: 200, h: 200 } // default
}

// Parse text content from quotes
function parseTextContent(text: string): string {
  const quoteMatch = text.match(/["']([^"']+)["']/)
  if (quoteMatch) return quoteMatch[1]

  // Try to get text after "saying" or "with text"
  const sayingMatch = text.match(/(?:saying|with text|that says)\s+["']?([^"']+)["']?$/i)
  if (sayingMatch) return sayingMatch[1].trim()

  return 'Text'
}

// Create a rectangle shape
function createRectangle(editor: Editor, command: string): CommandResult {
  const pos = parsePosition(command, editor)
  const size = parseSize(command)

  const shapeId = createShapeId()

  const shape: TLShapePartial = {
    id: shapeId,
    type: 'geo',
    x: pos.x - size.w / 2,
    y: pos.y - size.h / 2,
    props: {
      geo: 'rectangle',
      w: size.w,
      h: size.h,
    },
  }

  editor.createShape(shape)
  return { success: true, message: `Created rectangle at (${Math.round(pos.x)}, ${Math.round(pos.y)})` }
}

// Create an ellipse/circle shape
function createEllipse(editor: Editor, command: string): CommandResult {
  const pos = parsePosition(command, editor)
  const size = parseSize(command)
  const isCircle = command.toLowerCase().includes('circle')

  const shapeId = createShapeId()
  const finalSize = isCircle ? { w: size.w, h: size.w } : size

  const shape: TLShapePartial = {
    id: shapeId,
    type: 'geo',
    x: pos.x - finalSize.w / 2,
    y: pos.y - finalSize.h / 2,
    props: {
      geo: 'ellipse',
      w: finalSize.w,
      h: finalSize.h,
    },
  }

  editor.createShape(shape)
  return { success: true, message: `Created ${isCircle ? 'circle' : 'ellipse'} at (${Math.round(pos.x)}, ${Math.round(pos.y)})` }
}

// Create a triangle shape
function createTriangle(editor: Editor, command: string): CommandResult {
  const pos = parsePosition(command, editor)
  const size = parseSize(command)

  const shapeId = createShapeId()

  const shape: TLShapePartial = {
    id: shapeId,
    type: 'geo',
    x: pos.x - size.w / 2,
    y: pos.y - size.h / 2,
    props: {
      geo: 'triangle',
      w: size.w,
      h: size.h,
    },
  }

  editor.createShape(shape)
  return { success: true, message: `Created triangle at (${Math.round(pos.x)}, ${Math.round(pos.y)})` }
}

// Create a star shape
function createStar(editor: Editor, command: string): CommandResult {
  const pos = parsePosition(command, editor)
  const size = parseSize(command)

  const shapeId = createShapeId()

  const shape: TLShapePartial = {
    id: shapeId,
    type: 'geo',
    x: pos.x - size.w / 2,
    y: pos.y - size.h / 2,
    props: {
      geo: 'star',
      w: size.w,
      h: size.h,
    },
  }

  editor.createShape(shape)
  return { success: true, message: `Created star at (${Math.round(pos.x)}, ${Math.round(pos.y)})` }
}

// Create a text shape
function createText(editor: Editor, command: string): CommandResult {
  const pos = parsePosition(command, editor)
  const textContent = parseTextContent(command)

  const shapeId = createShapeId()

  const shape: TLShapePartial = {
    id: shapeId,
    type: 'text',
    x: pos.x,
    y: pos.y,
    props: {
      text: textContent,
      size: 'm',
      autoSize: true,
    },
  }

  editor.createShape(shape)
  return { success: true, message: `Created text "${textContent}"` }
}

// Create an arrow between positions
function createArrow(editor: Editor, command: string): CommandResult {
  const shapeId = createShapeId()
  const viewport = editor.getViewportScreenBounds()
  const centerX = viewport.width / 2
  const centerY = viewport.height / 2

  // Default arrow from left to right
  let startX = centerX - 100
  let startY = centerY
  let endX = centerX + 100
  let endY = centerY

  const lowerCommand = command.toLowerCase()

  // Parse directional arrows
  if (lowerCommand.includes('down')) {
    endX = startX
    endY = startY + 150
  } else if (lowerCommand.includes('up')) {
    endX = startX
    endY = startY - 150
  } else if (lowerCommand.includes('left')) {
    endX = startX - 150
  } else if (lowerCommand.includes('diagonal')) {
    endX = startX + 150
    endY = startY + 150
  }

  // Parse from-to syntax
  const fromToMatch = command.match(/from\s*\(?(\d+)\s*,\s*(\d+)\)?\s*to\s*\(?(\d+)\s*,\s*(\d+)\)?/i)
  if (fromToMatch) {
    startX = parseInt(fromToMatch[1], 10)
    startY = parseInt(fromToMatch[2], 10)
    endX = parseInt(fromToMatch[3], 10)
    endY = parseInt(fromToMatch[4], 10)
  }

  const shape: TLShapePartial = {
    id: shapeId,
    type: 'arrow',
    x: startX,
    y: startY,
    props: {
      start: { x: 0, y: 0 },
      end: { x: endX - startX, y: endY - startY },
    },
  }

  editor.createShape(shape)
  return { success: true, message: `Created arrow` }
}

// Create a line
function createLine(editor: Editor, command: string): CommandResult {
  const shapeId = createShapeId()
  const viewport = editor.getViewportScreenBounds()
  const centerX = viewport.width / 2
  const centerY = viewport.height / 2

  let endDx = 200
  let endDy = 0

  const lowerCommand = command.toLowerCase()

  if (lowerCommand.includes('vertical')) {
    endDx = 0
    endDy = 200
  } else if (lowerCommand.includes('diagonal')) {
    endDx = 150
    endDy = 150
  }

  const shape: TLShapePartial = {
    id: shapeId,
    type: 'line',
    x: centerX - endDx / 2,
    y: centerY - endDy / 2,
    props: {
      points: {
        a1: { id: 'a1', index: 'a1', x: 0, y: 0 },
        a2: { id: 'a2', index: 'a2', x: endDx, y: endDy },
      },
    },
  }

  editor.createShape(shape)
  return { success: true, message: `Created line` }
}

// Create a note/sticky
function createNote(editor: Editor, command: string): CommandResult {
  const pos = parsePosition(command, editor)
  const textContent = parseTextContent(command)
  const size = parseSize(command)

  const shapeId = createShapeId()

  const shape: TLShapePartial = {
    id: shapeId,
    type: 'note',
    x: pos.x - size.w / 2,
    y: pos.y - size.h / 2,
    props: {
      text: textContent,
      size: 'm',
    },
  }

  editor.createShape(shape)
  return { success: true, message: `Created note "${textContent}"` }
}

// Create a frame
function createFrame(editor: Editor, command: string): CommandResult {
  const pos = parsePosition(command, editor)
  const size = parseSize(command)
  const textContent = parseTextContent(command)

  const shapeId = createShapeId()

  const shape: TLShapePartial = {
    id: shapeId,
    type: 'frame',
    x: pos.x - size.w / 2,
    y: pos.y - size.h / 2,
    props: {
      w: Math.max(size.w, 300),
      h: Math.max(size.h, 200),
      name: textContent !== 'Text' ? textContent : 'Frame',
    },
  }

  editor.createShape(shape)
  return { success: true, message: `Created frame "${textContent !== 'Text' ? textContent : 'Frame'}"` }
}

// Clear the canvas
function clearCanvas(editor: Editor): CommandResult {
  const shapes = editor.getCurrentPageShapes()
  if (shapes.length === 0) {
    return { success: true, message: 'Canvas is already empty' }
  }
  editor.deleteShapes(shapes.map(s => s.id))
  return { success: true, message: `Cleared ${shapes.length} shape(s) from canvas` }
}

// Delete selected shapes
function deleteSelected(editor: Editor): CommandResult {
  const selected = editor.getSelectedShapes()
  if (selected.length === 0) {
    return { success: false, message: 'No shapes selected' }
  }
  editor.deleteShapes(selected.map(s => s.id))
  return { success: true, message: `Deleted ${selected.length} shape(s)` }
}

// Select all shapes
function selectAll(editor: Editor): CommandResult {
  const shapes = editor.getCurrentPageShapes()
  if (shapes.length === 0) {
    return { success: true, message: 'No shapes to select' }
  }
  editor.selectAll()
  return { success: true, message: `Selected ${shapes.length} shape(s)` }
}

// Zoom to fit
function zoomToFit(editor: Editor): CommandResult {
  editor.zoomToFit()
  return { success: true, message: 'Zoomed to fit all shapes' }
}

// Undo last action
function undoAction(editor: Editor): CommandResult {
  editor.undo()
  return { success: true, message: 'Undid last action' }
}

// Redo last action
function redoAction(editor: Editor): CommandResult {
  editor.redo()
  return { success: true, message: 'Redid last action' }
}

// Create diamond/rhombus
function createDiamond(editor: Editor, command: string): CommandResult {
  const pos = parsePosition(command, editor)
  const size = parseSize(command)

  const shapeId = createShapeId()

  const shape: TLShapePartial = {
    id: shapeId,
    type: 'geo',
    x: pos.x - size.w / 2,
    y: pos.y - size.h / 2,
    props: {
      geo: 'diamond',
      w: size.w,
      h: size.h,
    },
  }

  editor.createShape(shape)
  return { success: true, message: `Created diamond at (${Math.round(pos.x)}, ${Math.round(pos.y)})` }
}

// Create hexagon
function createHexagon(editor: Editor, command: string): CommandResult {
  const pos = parsePosition(command, editor)
  const size = parseSize(command)

  const shapeId = createShapeId()

  const shape: TLShapePartial = {
    id: shapeId,
    type: 'geo',
    x: pos.x - size.w / 2,
    y: pos.y - size.h / 2,
    props: {
      geo: 'hexagon',
      w: size.w,
      h: size.h,
    },
  }

  editor.createShape(shape)
  return { success: true, message: `Created hexagon at (${Math.round(pos.x)}, ${Math.round(pos.y)})` }
}

// Create cloud shape
function createCloud(editor: Editor, command: string): CommandResult {
  const pos = parsePosition(command, editor)
  const size = parseSize(command)

  const shapeId = createShapeId()

  const shape: TLShapePartial = {
    id: shapeId,
    type: 'geo',
    x: pos.x - size.w / 2,
    y: pos.y - size.h / 2,
    props: {
      geo: 'cloud',
      w: size.w,
      h: size.h,
    },
  }

  editor.createShape(shape)
  return { success: true, message: `Created cloud at (${Math.round(pos.x)}, ${Math.round(pos.y)})` }
}

// Main command parser
export function executeCommand(editor: Editor, command: string): CommandResult {
  const lowerCommand = command.toLowerCase().trim()

  // Empty command
  if (!lowerCommand) {
    return { success: false, message: 'Please enter a command' }
  }

  // Clear/delete commands
  if (lowerCommand.match(/^(clear|reset|erase)\s*(all|canvas|everything)?$/)) {
    return clearCanvas(editor)
  }

  if (lowerCommand.match(/^delete\s*(selected|selection)?$/) || lowerCommand === 'remove') {
    return deleteSelected(editor)
  }

  // Selection commands
  if (lowerCommand === 'select all') {
    return selectAll(editor)
  }

  // View commands
  if (lowerCommand.match(/^(zoom to fit|fit|fit all)$/)) {
    return zoomToFit(editor)
  }

  // History commands
  if (lowerCommand === 'undo') {
    return undoAction(editor)
  }

  if (lowerCommand === 'redo') {
    return redoAction(editor)
  }

  // Shape creation commands
  if (lowerCommand.match(/\b(rect|rectangle|box|square)\b/)) {
    return createRectangle(editor, command)
  }

  if (lowerCommand.match(/\b(circle|ellipse|oval)\b/)) {
    return createEllipse(editor, command)
  }

  if (lowerCommand.match(/\btriangle\b/)) {
    return createTriangle(editor, command)
  }

  if (lowerCommand.match(/\bstar\b/)) {
    return createStar(editor, command)
  }

  if (lowerCommand.match(/\b(diamond|rhombus)\b/)) {
    return createDiamond(editor, command)
  }

  if (lowerCommand.match(/\bhexagon\b/)) {
    return createHexagon(editor, command)
  }

  if (lowerCommand.match(/\bcloud\b/)) {
    return createCloud(editor, command)
  }

  if (lowerCommand.match(/\b(text|write|type)\b/)) {
    return createText(editor, command)
  }

  if (lowerCommand.match(/\b(arrow|pointer)\b/)) {
    return createArrow(editor, command)
  }

  if (lowerCommand.match(/\bline\b/)) {
    return createLine(editor, command)
  }

  if (lowerCommand.match(/\b(note|sticky|post-?it)\b/)) {
    return createNote(editor, command)
  }

  if (lowerCommand.match(/\bframe\b/)) {
    return createFrame(editor, command)
  }

  // Help command
  if (lowerCommand === 'help') {
    return {
      success: true,
      message: `Available commands:
• Shapes: rectangle, circle, triangle, star, diamond, hexagon, cloud
• Elements: text "content", arrow, line, note "content", frame "name"
• Modifiers: small/medium/large, at X,Y, left/right/top/bottom
• Actions: clear, delete, select all, undo, redo, zoom to fit
• Examples:
  - "draw a large blue circle"
  - "rectangle at 100, 200"
  - "text 'Hello World' at center"
  - "arrow pointing down"`,
    }
  }

  // Draw/create/add/make prefix - try to parse the rest
  const drawMatch = lowerCommand.match(/^(?:draw|create|add|make|put)\s+(?:a\s+)?(.+)$/i)
  if (drawMatch) {
    return executeCommand(editor, drawMatch[1])
  }

  return { success: false, message: `Unknown command: "${command}". Type "help" for available commands.` }
}
