
import requests

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "llama3.2:1b"

messages = []

SYSTEM_MESSAGE = (
    "You are a helpful AI assistant. "
    "Answer in clear, simple English. "
    "Explain technical topics step by step."
)


def get_ai_response():
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_MESSAGE},
            *messages,
        ],
        "stream": False,
    }

    response = requests.post(
        OLLAMA_URL,
        json=payload,
        timeout=180,
    )

    response.raise_for_status()

    return response.json()["message"]["content"]


print("🤖 AI Chatbot Started!")
print("Type 'exit' to stop.\n")

while True:
    user_input = input("You: ").strip()

    if user_input.lower() == "exit":
        print("AI: Goodbye!")
        break

    if not user_input:
        continue

    messages.append({
        "role": "user",
        "content": user_input,
    })

    try:
        answer = get_ai_response()

        messages.append({
            "role": "assistant",
            "content": answer,
        })

        print(f"\nAI: {answer}\n")

    except requests.exceptions.RequestException as error:
        messages.pop()
        print(f"\nError connecting to AI: {error}\n")
