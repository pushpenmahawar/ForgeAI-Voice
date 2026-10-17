
import { useEffect, useRef, useState } from 'react'
import './App.css'


type SpeechRecognitionResult = {
  transcript: string
}

type SpeechRecognitionItem = ArrayLike<SpeechRecognitionResult> & {
  isFinal: boolean
}

type SpeechRecognitionEvent = {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionItem>
}


type SpeechRecognitionInstance = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}


type Message = {
  role: 'user' | 'assistant'
  content: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState('Checking...')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [isListening, setIsListening] = useState(false)
  const [speechError, setSpeechError] = useState('')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const finalTranscriptRef = useRef('')
  const [conversationId] = useState(() => crypto.randomUUID())


  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then((response) => {
        if (!response.ok) throw new Error('Backend unavailable')
        return response.json()
      })
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus('offline'))
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = input.trim()

    if (!message || loading) return

    setMessages((current) => [
      ...current,
      { role: 'user', content: message },
    ])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
  message,
  conversation_id: conversationId,
}),
      })

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`)
      }

      const data: { reply: string } = await response.json()

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.reply },
      ])
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            'I could not reach the AI service. Check that the backend and Ollama are running, then try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }


  async function sendVoiceMessage(message: string) {
    if (!message || loading) return

    setMessages((current) => [
      ...current,
      { role: 'user', content: message },
    ])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, 
       body: JSON.stringify({
  message,
  conversation_id: conversationId,
}),
      })

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`)
      }

      const data: { reply: string } = await response.json()

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.reply },
      ])

      // Speak the AI response.
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(data.reply)
      utterance.lang = 'en-IN'
      utterance.rate = 1
      window.speechSynthesis.speak(utterance)
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'I could not reach the AI service. Check the backend and Ollama.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }


  function toggleMicrophone() {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const speechWindow = window as SpeechWindow
    const SpeechRecognitionAPI =
      speechWindow.SpeechRecognition ||
      speechWindow.webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      setSpeechError(
        'Speech recognition is not supported in this browser. Try Chrome.'
      )
      return
    }

    setSpeechError('')

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'en-IN'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event) => {
      let currentTranscript = ''

      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript
      }

      // Show the recognized words in the input.
      setInput(currentTranscript.trim())

      // Save only finalized speech for automatic sending.
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current +=
            event.results[i][0].transcript + ' '
        }
      }
    }

    recognition.onerror = (event) => {
      setSpeechError(`Microphone error: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)

      const message = finalTranscriptRef.current.trim()
      finalTranscriptRef.current = ''

      if (message) {
        void sendVoiceMessage(message)
      }
    }

    recognitionRef.current = recognition

    try {
      finalTranscriptRef.current = ''
      recognition.start()
      setIsListening(true)
    } catch {
      setSpeechError('Could not start microphone. Please try again.')
      setIsListening(false)
    }
  }


  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">F</div>
          <span>FORGE<span className="brand-light">AI</span></span>
        </div>

        <div className="status">
          <span
            className={`status-dot ${backendStatus !== 'healthy' ? 'offline' : ''}`}
          />
          Backend: {backendStatus}
        </div>
      </header>

      <section className="hero chat-hero">
        <div className="eyebrow">YOUR PERSONAL AI ASSISTANT</div>
        <h1>
          Intelligence that
          <br />
          <span>speaks your language.</span>
        </h1>
        <p className="subtitle">
          Ask anything. Think out loud. Get things done.
          <br />
          Your AI assistant, running on your machine.
        </p>

        <div className="chat-panel">
          <div className="chat-heading">
            <div>
              <strong>ForgeAI Assistant</strong>
              <p>Powered by your local Qwen model</p>
            </div>
            <span className="model-tag">QWEN · 7B</span>
          </div>

          <div className="messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <div className="welcome-orb">F</div>
                <h2>What can I help you with?</h2>
                <p>Ask a question to start your conversation.</p>
                <div className="suggestions">
                  {[
                    'What is the capital of India?',
                    'Explain Kotlin coroutines simply.',
                    'Give me an interesting fact.',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="suggestion"
                      onClick={() => setInput(suggestion)}
                    >
                      {suggestion} <span>↗</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`message-row ${message.role}`}
              >
                {message.role === 'assistant' && (
                  <div className="avatar">F</div>
                )}
                <div className="message-bubble">{message.content}</div>
              </div>
            ))}

            {loading && (
              <div className="message-row assistant">
                <div className="avatar">F</div>
                <div className="message-bubble typing">
                  <span />
                  <span />
                  <span />
                  <small>Thinking...</small>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-form" onSubmit={sendMessage}>

            <button
              type="button"
              className={`mic-button ${isListening ? 'mic-active' : ''}`}
              onClick={toggleMicrophone}
              aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
            >
              {isListening ? '■' : '🎙'}
            </button>

            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Message ForgeAI..."
              aria-label="Message ForgeAI"
              disabled={loading}
            />
            <button
              className="send-button"
              type="submit"
              disabled={loading || !input.trim()}
            >
              Send <span>↑</span>
            </button>
          </form>

          {isListening && (
            <p className="privacy-note">Listening... Speak now.</p>
          )}

          {speechError && (
            <p className="speech-error">{speechError}</p>
          )}

          <p className="privacy-note">
            Local model · Responses may take a few seconds
          </p>
        </div>
      </section>

      <footer>
        <span>FORGEAI VOICE</span>
        <span>Built for intelligent conversations</span>
      </footer>
    </main>
  )
}

export default App
