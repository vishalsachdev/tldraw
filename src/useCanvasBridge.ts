import { useEffect, useRef, useCallback } from 'react'
import { Editor, createShapeId, TLShapePartial, toRichText } from 'tldraw'

const WS_URL = 'ws://localhost:3333'

interface CanvasCommand {
  id: number
  command: string
  params: Record<string, unknown>
}

export function useCanvasBridge(editor: Editor | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)

  const createShape = useCallback((editor: Editor, params: Record<string, unknown>) => {
    const shapeId = createShapeId()
    const kind = params.kind as string
    const x = params.x as number
    const y = params.y as number
    const width = (params.width as number) ?? 100
    const height = (params.height as number) ?? 100
    const text = params.text as string | undefined
    const endX = params.endX as number | undefined
    const endY = params.endY as number | undefined

    let shapePartial: TLShapePartial

    switch (kind) {
      case 'rectangle':
        shapePartial = {
          id: shapeId,
          type: 'geo',
          x: x - width / 2,
          y: y - height / 2,
          props: { geo: 'rectangle', w: width, h: height },
        }
        break

      case 'circle':
        shapePartial = {
          id: shapeId,
          type: 'geo',
          x: x - width / 2,
          y: y - width / 2,
          props: { geo: 'ellipse', w: width, h: width },
        }
        break

      case 'ellipse':
        shapePartial = {
          id: shapeId,
          type: 'geo',
          x: x - width / 2,
          y: y - height / 2,
          props: { geo: 'ellipse', w: width, h: height },
        }
        break

      case 'triangle':
        shapePartial = {
          id: shapeId,
          type: 'geo',
          x: x - width / 2,
          y: y - height / 2,
          props: { geo: 'triangle', w: width, h: height },
        }
        break

      case 'star':
        shapePartial = {
          id: shapeId,
          type: 'geo',
          x: x - width / 2,
          y: y - height / 2,
          props: { geo: 'star', w: width, h: height },
        }
        break

      case 'diamond':
        shapePartial = {
          id: shapeId,
          type: 'geo',
          x: x - width / 2,
          y: y - height / 2,
          props: { geo: 'diamond', w: width, h: height },
        }
        break

      case 'hexagon':
        shapePartial = {
          id: shapeId,
          type: 'geo',
          x: x - width / 2,
          y: y - height / 2,
          props: { geo: 'hexagon', w: width, h: height },
        }
        break

      case 'cloud':
        shapePartial = {
          id: shapeId,
          type: 'geo',
          x: x - width / 2,
          y: y - height / 2,
          props: { geo: 'cloud', w: width, h: height },
        }
        break

      case 'text':
        shapePartial = {
          id: shapeId,
          type: 'text',
          x: x,
          y: y,
          props: { richText: toRichText(text ?? 'Text') },
        }
        break

      case 'note':
        shapePartial = {
          id: shapeId,
          type: 'note',
          x: x - width / 2,
          y: y - height / 2,
          props: { richText: toRichText(text ?? 'Note') },
        }
        break

      case 'arrow':
        shapePartial = {
          id: shapeId,
          type: 'arrow',
          x: x,
          y: y,
          props: {
            start: { x: 0, y: 0 },
            end: { x: endX ?? 100, y: endY ?? 0 },
          },
        }
        break

      case 'line':
        shapePartial = {
          id: shapeId,
          type: 'line',
          x: x,
          y: y,
          props: {
            points: {
              a1: { id: 'a1', index: 'a1', x: 0, y: 0 },
              a2: { id: 'a2', index: 'a2', x: endX ?? 100, y: endY ?? 0 },
            },
          },
        }
        break

      case 'draw':
      case 'freehand': {
        // Freehand drawing shape with segments
        // params.points should be array of {x, y} or {x, y, z} points
        // Or params.segments for multiple segments
        const points = params.points as Array<{x: number, y: number, z?: number}> | undefined
        const segments = params.segments as Array<{type: 'free' | 'straight', points: Array<{x: number, y: number, z?: number}>}> | undefined
        const color = (params.color as string) ?? 'black'
        const size = (params.size as string) ?? 'm'
        const isClosed = (params.isClosed as boolean) ?? false
        const fill = (params.fill as string) ?? 'none'

        let drawSegments: Array<{type: 'free' | 'straight', points: Array<{x: number, y: number, z: number}>}>

        if (segments) {
          drawSegments = segments.map(seg => ({
            type: seg.type,
            points: seg.points.map(p => ({ x: p.x, y: p.y, z: p.z ?? 0.5 }))
          }))
        } else if (points) {
          drawSegments = [{
            type: 'free' as const,
            points: points.map(p => ({ x: p.x, y: p.y, z: p.z ?? 0.5 }))
          }]
        } else {
          return { error: 'Draw shape requires points or segments' }
        }

        shapePartial = {
          id: shapeId,
          type: 'draw',
          x: x,
          y: y,
          props: {
            segments: drawSegments,
            color: color,
            size: size,
            fill: fill,
            dash: 'draw',
            isComplete: true,
            isClosed: isClosed,
            isPen: false,
            scale: 1,
          },
        }
        break
      }

      default:
        return { error: `Unknown shape kind: ${kind}` }
    }

    editor.createShape(shapePartial)
    return { success: true, shapeId: shapeId }
  }, [])

  const handleCommand = useCallback((editor: Editor, command: CanvasCommand): unknown => {
    const { command: cmd, params } = command

    switch (cmd) {
      case 'create_shape':
        return createShape(editor, params)

      case 'create_shapes': {
        const shapes = params.shapes as Record<string, unknown>[]
        const results = shapes.map(shape => createShape(editor, shape))
        return { success: true, count: shapes.length, results }
      }

      case 'clear': {
        const shapes = editor.getCurrentPageShapes()
        if (shapes.length > 0) {
          editor.deleteShapes(shapes.map(s => s.id))
        }
        return { success: true, deletedCount: shapes.length }
      }

      case 'get_shapes': {
        const shapes = editor.getCurrentPageShapes()
        return shapes.map(shape => ({
          id: shape.id,
          type: shape.type,
          x: shape.x,
          y: shape.y,
          props: shape.props,
        }))
      }

      case 'undo':
        editor.undo()
        return { success: true }

      case 'redo':
        editor.redo()
        return { success: true }

      case 'zoom_to_fit':
        editor.zoomToFit()
        return { success: true }

      case 'delete_selected': {
        const selected = editor.getSelectedShapes()
        if (selected.length > 0) {
          editor.deleteShapes(selected.map(s => s.id))
        }
        return { success: true, deletedCount: selected.length }
      }

      default:
        return { error: `Unknown command: ${cmd}` }
    }
  }, [createShape])

  const connect = useCallback(() => {
    if (!editor) return

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[Canvas] Connected to MCP bridge')
      }

      ws.onmessage = (event) => {
        try {
          const command = JSON.parse(event.data) as CanvasCommand
          console.log('[Canvas] Received command:', command.command)
          const result = handleCommand(editor, command)
          ws.send(JSON.stringify({ id: command.id, result }))
        } catch (e) {
          console.error('[Canvas] Error handling command:', e)
        }
      }

      ws.onclose = () => {
        console.log('[Canvas] Disconnected, reconnecting in 2s...')
        wsRef.current = null
        reconnectTimeoutRef.current = window.setTimeout(connect, 2000)
      }

      ws.onerror = () => {
        // Will trigger onclose
      }
    } catch (e) {
      console.error('[Canvas] Connection error:', e)
      reconnectTimeoutRef.current = window.setTimeout(connect, 2000)
    }
  }, [editor, handleCommand])

  useEffect(() => {
    if (editor) {
      connect()
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [editor, connect])
}
