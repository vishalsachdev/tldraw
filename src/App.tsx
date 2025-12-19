import { useCallback, useRef, useState, useEffect } from 'react'
import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { interpretCommand, executeOperations } from './llmService'
import { useCanvasBridge } from './useCanvasBridge'
import './App.css'

interface CommandLogEntry {
  id: number
  command: string
  result: { success: boolean; message: string }
  timestamp: Date
}

const API_KEY_STORAGE_KEY = 'openai-api-key'
const ENV_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined

export default function App() {
  const editorRef = useRef<Editor | null>(null)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [command, setCommand] = useState('')
  const [commandLog, setCommandLog] = useState<CommandLogEntry[]>([])
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const logIdCounter = useRef(0)

  // Connect to MCP bridge for Claude Code control
  useCanvasBridge(editor)

  // Load API key from env or localStorage on mount
  useEffect(() => {
    if (ENV_API_KEY) {
      setApiKey(ENV_API_KEY)
    } else {
      const stored = localStorage.getItem(API_KEY_STORAGE_KEY)
      if (stored) {
        setApiKey(stored)
      } else {
        setShowApiKeyInput(true)
      }
    }
  }, [])

  const handleMount = useCallback((e: Editor) => {
    editorRef.current = e
    setEditor(e)
  }, [])

  const saveApiKey = useCallback(() => {
    if (apiKeyInput.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKeyInput.trim())
      setApiKey(apiKeyInput.trim())
      setShowApiKeyInput(false)
      setApiKeyInput('')
    }
  }, [apiKeyInput])

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(API_KEY_STORAGE_KEY)
    setApiKey('')
    setShowApiKeyInput(true)
  }, [])

  const runCommand = useCallback(async () => {
    if (!editorRef.current || !command.trim() || !apiKey || isLoading) return

    setIsLoading(true)
    const currentCommand = command.trim()
    setCommand('')

    try {
      const llmResponse = await interpretCommand(apiKey, currentCommand)
      const result = executeOperations(editorRef.current, llmResponse)

      setCommandLog((prev) => [
        {
          id: logIdCounter.current++,
          command: currentCommand,
          result,
          timestamp: new Date(),
        },
        ...prev.slice(0, 49),
      ])
    } catch (error) {
      setCommandLog((prev) => [
        {
          id: logIdCounter.current++,
          command: currentCommand,
          result: {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
          },
          timestamp: new Date(),
        },
        ...prev.slice(0, 49),
      ])
    } finally {
      setIsLoading(false)
    }
  }, [command, apiKey, isLoading])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isLoading) {
        e.preventDefault()
        runCommand()
      }
    },
    [runCommand, isLoading]
  )

  const handleApiKeyKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        saveApiKey()
      }
    },
    [saveApiKey]
  )

  return (
    <div className="app">
      <div className="canvas-container">
        <Tldraw onMount={handleMount} />
      </div>

      <div className={`command-panel ${isInputFocused ? 'focused' : ''}`}>
        <div className="command-header">
          <div className="header-left">
            <span className="command-icon">✨</span>
            <span className="command-title">AI Canvas</span>
          </div>
          <button
            className="settings-button"
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            title="API Key Settings"
          >
            ⚙
          </button>
        </div>

        {showApiKeyInput && (
          <div className="api-key-section">
            <div className="api-key-label">OpenAI API Key</div>
            <div className="api-key-input-wrapper">
              <input
                type="password"
                className="api-key-input"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={handleApiKeyKeyDown}
                placeholder={apiKey ? '••••••••••••••••' : 'sk-...'}
              />
              {apiKey ? (
                <button className="api-key-button danger" onClick={clearApiKey}>
                  Clear
                </button>
              ) : (
                <button
                  className="api-key-button"
                  onClick={saveApiKey}
                  disabled={!apiKeyInput.trim()}
                >
                  Save
                </button>
              )}
            </div>
            {apiKey && (
              <div className="api-key-status">
                <span className="status-dot"></span>
                API key configured
              </div>
            )}
          </div>
        )}

        <div className="command-input-wrapper">
          <span className="prompt-symbol">{isLoading ? '◌' : '›'}</span>
          <input
            type="text"
            className="command-input"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder={
              !apiKey
                ? 'Enter API key first...'
                : isLoading
                ? 'Thinking...'
                : 'Describe what to draw...'
            }
            disabled={!apiKey || isLoading}
            autoFocus
          />
          <button
            className="run-button"
            onClick={runCommand}
            disabled={!command.trim() || !apiKey || isLoading}
          >
            {isLoading ? '...' : 'Run'}
          </button>
        </div>

        <div className="command-log">
          {commandLog.length === 0 ? (
            <div className="empty-log">
              <p className="empty-log-title">
                {apiKey ? 'Ready for commands' : 'Add your OpenAI API key'}
              </p>
              <p className="empty-log-hint">
                {apiKey
                  ? 'Try: "draw a house", "5 circles in a row", "a flowchart with 3 boxes"'
                  : 'Click the gear icon above to add your key'}
              </p>
            </div>
          ) : (
            commandLog.map((entry) => (
              <div
                key={entry.id}
                className={`log-entry ${entry.result.success ? 'success' : 'error'}`}
              >
                <div className="log-command">
                  <span className="log-prompt">›</span>
                  <span className="log-text">{entry.command}</span>
                </div>
                <div className="log-result">
                  <span
                    className={`status-indicator ${entry.result.success ? 'success' : 'error'}`}
                  >
                    {entry.result.success ? '✓' : '✗'}
                  </span>
                  <span className="log-message">{entry.result.message}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="quick-commands">
          <span className="quick-label">Ideas:</span>
          {[
            'draw a smiley face',
            'flowchart',
            'solar system',
            'clear',
          ].map((cmd) => (
            <button
              key={cmd}
              className="quick-button"
              disabled={!apiKey || isLoading}
              onClick={async () => {
                if (!editorRef.current || !apiKey || isLoading) return
                setIsLoading(true)
                try {
                  const llmResponse = await interpretCommand(apiKey, cmd)
                  const result = executeOperations(editorRef.current, llmResponse)
                  setCommandLog((prev) => [
                    {
                      id: logIdCounter.current++,
                      command: cmd,
                      result,
                      timestamp: new Date(),
                    },
                    ...prev.slice(0, 49),
                  ])
                } catch (error) {
                  setCommandLog((prev) => [
                    {
                      id: logIdCounter.current++,
                      command: cmd,
                      result: {
                        success: false,
                        message:
                          error instanceof Error ? error.message : 'Unknown error',
                      },
                      timestamp: new Date(),
                    },
                    ...prev.slice(0, 49),
                  ])
                } finally {
                  setIsLoading(false)
                }
              }}
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
