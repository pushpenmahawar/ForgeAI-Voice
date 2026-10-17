# ForgeAI Voice 🎙️

**A local-first AI voice assistant powered by Ollama, Qwen, FastAPI, and React.**

ForgeAI Voice is a personal AI assistant that supports text-based conversations, voice input, spoken responses, and context-aware follow-up questions. The project is being developed incrementally toward a general-purpose AI agent capable of using tools and performing tasks.

## ✨ Features

- **AI Chat:** Ask general-purpose questions using a locally running LLM.
- **Voice Input:** Speak to the assistant using browser speech recognition.
- **Voice Responses:** Listen to AI-generated answers using browser speech synthesis.
- **Conversation Memory:** Maintain context across messages within a conversation.
- **Context-Aware Responses:** Understand follow-up questions using previous messages.
- **Modern Web Interface:** Interactive chat UI built with React and TypeScript.
- **Python Backend:** FastAPI REST API for handling chat requests.
- **Local LLM:** Run Qwen through Ollama on your own machine.

## 🏗️ Architecture

```text
                 ┌────────────────────────┐
                 │   React + TypeScript   │
                 │      Vite Frontend     │
                 │                        │
                 │ Chat · Voice · Speech  │
                 └───────────┬────────────┘
                             │ HTTP / JSON
                             ▼
                 ┌────────────────────────┐
                 │      FastAPI Backend   │
                 │                        │
                 │ Chat API · Memory      │
                 └───────────┬────────────┘
                             │
                             ▼
                 ┌────────────────────────┐
                 │      Ollama Runtime    │
                 │    Qwen 2.5 7B Model   │
                 └────────────────────────┘
```

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI |
| LLM Runtime | Ollama |
| Language Model | `qwen2.5:7b-instruct` |
| Voice Input | Browser Web Speech API |
| Voice Output | Browser SpeechSynthesis API |
| API | REST / JSON |

## 📋 Prerequisites

Install the following before running the project:

- Python 3.12
- Node.js and npm
- Ollama
- Git

The Qwen model requires several gigabytes of disk space and sufficient RAM.

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/pushpenmahawar/ForgeAI-Voice.git
cd ForgeAI-Voice
```

### 2. Download the AI model

Install Ollama from [ollama.com](https://ollama.com/).

Start the Ollama service if it is not already running:

```bash
ollama serve
```

In another terminal, download the model:

```bash
ollama pull qwen2.5:7b-instruct
```

### 3. Run the backend

From the project root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Backend endpoints:

- API root: http://localhost:8000/
- Health check: http://localhost:8000/health
- Interactive API documentation: http://localhost:8000/docs

### 4. Run the frontend

Open a second terminal:

```bash
cd ~/ForgeAI-Voice/frontend
npm install
npm run dev
```

Open the application:

**http://localhost:5173/**

Keep Ollama and the backend running while using the application.

## 🔌 API Reference

### `GET /health`

Checks whether the backend is responding.

### `POST /chat`

Sends a message to the assistant.

Example request:

```json
{
  "message": "What is the capital of India?",
  "conversation_id": "your-conversation-id"
}
```

Example response:

```json
{
  "reply": "The capital of India is New Delhi.",
  "conversation_id": "your-conversation-id"
}
```

Use the same `conversation_id` for messages in the same conversation so the backend can access the associated history.

## 🧠 Conversation Memory

The current implementation uses in-memory storage.

- Each conversation is associated with a conversation ID.
- User messages and assistant responses are stored in the backend process.
- Recent messages are supplied to the LLM as conversational context.
- Up to 20 previous messages are included in the model request.
- Conversation history is lost when the backend restarts.
- Persistent database storage is not implemented yet.

## 🎙️ Voice Interaction

Voice input and output use browser-provided speech APIs.

- Microphone access requires browser permission.
- Speech recognition support depends on the browser and operating system.
- Browser speech services may require internet access and may process audio outside the local machine.
- Spoken responses use the browser's available speech synthesis voices.

## 🔐 Security and Privacy

- Never commit credentials, API keys, or private environment files.
- Conversation history currently resides in backend memory.
- Do not expose the Ollama API directly to the public internet.
- Before public deployment, configure production CORS settings, authentication, request limits, and appropriate network protections.

## 🗺️ Roadmap

Planned improvements include:

- Persistent conversation memory
- Improved voice interaction and latency measurements
- Alternative speech-to-text and text-to-speech engines
- AI tool calling and task execution
- Optional web search and external integrations
- Production deployment and monitoring

## 🤝 Contributing

Suggestions, bug reports, and contributions are welcome. Open an issue to discuss significant changes before submitting a pull request.

## 📄 License

No license has been added yet. Until one is specified, do not assume that the repository grants permission to reuse or redistribute its code.
