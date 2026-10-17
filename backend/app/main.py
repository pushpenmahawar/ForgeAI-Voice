
from collections import defaultdict
from threading import Lock

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import ollama

app = FastAPI(
    title="ForgeAI Voice",
    description="Local-first voice AI assistant",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary conversation storage.
# Each conversation contains alternating user and assistant messages.
conversation_store: dict[str, list[dict[str, str]]] = defaultdict(list)
conversation_lock = Lock()

MODEL_NAME = "qwen2.5:7b-instruct"
MAX_HISTORY_MESSAGES = 20


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    conversation_id: str = Field(min_length=1, max_length=100)


@app.get("/")
async def root():
    return {
        "app": "ForgeAI Voice",
        "status": "running",
        "version": "0.2.0",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "forgeai-voice-backend",
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    message = request.message.strip()
    conversation_id = request.conversation_id.strip()

    if not message:
        return {"reply": "", "conversation_id": conversation_id}

    with conversation_lock:
        history = list(conversation_store[conversation_id])

    messages = [
     {
    "role": "system",
    "content": (
        "You are ForgeAI, a helpful general-purpose AI assistant. "
        "Use the full conversation history to understand follow-up questions, "
        "including pronouns, implied subjects, and previously established locations. "
        "Maintain relevant context across turns. "
        "If the conversation establishes a location, use that location for "
        "related follow-up questions unless the user specifies another location. "
        "For local recommendations, housing, services, or businesses, "
        "prioritize the established location. "
        "Do not assume the user is in the United States. "
        "Prefer information relevant to the established country and city. "
        "If a question requires current local listings or prices and you cannot "
        "verify them, say so rather than inventing details. "
        "Answer clearly and concisely."
    ),
},
        *history[-MAX_HISTORY_MESSAGES:],
        {"role": "user", "content": message},
    ]

    # Run the synchronous Ollama client outside the async event loop.
    import asyncio

    response = await asyncio.to_thread(
        ollama.chat,
        model=MODEL_NAME,
        messages=messages,
    )

    reply = response["message"]["content"]

    with conversation_lock:
        conversation_store[conversation_id].extend(
            [
                {"role": "user", "content": message},
                {"role": "assistant", "content": reply},
            ]
        )

    return {
        "reply": reply,
        "conversation_id": conversation_id,
    }
