# mobile-llm-chat 📱

Offline AI chat application built with React Native, Expo, SQLite, and on-device LLM inference — no internet connection or API keys required. Powered by [`llama.rn`](https://github.com/mybigday/llama.rn) for on-device inference and SQLite for persistent conversation history.

## ✨ Features

- 💬 **Chat with local models** — download and run GGUF models directly on your device
- 🗂️ **Conversation history** — every chat is saved locally and accessible from the sidebar
- 🔄 **Streaming responses** — tokens appear in real time as the model generates them
- 📝 **Markdown rendering** — bold, italic, inline code, code blocks, headers, and lists in responses
- 📴 **Fully offline** — once a model is downloaded, no network connection is needed to chat
- 🗑️ **Manage models** — download, select, and delete models from the Models screen

## 🛠️ Tech Stack

- [Expo](https://expo.dev) / React Native
- [Expo Router](https://docs.expo.dev/router/introduction/) — file-based navigation
- [`llama.rn`](https://github.com/mybigday/llama.rn) — on-device LLM inference (llama.cpp bindings)
- `expo-sqlite` — local persistence for conversations and messages
- TypeScript

## 📂 Project Structure

```
app/
  _layout.tsx          # Root layout — Stack navigator, sidebar, DB init
  index.tsx             # Redirects to /chat/new
  chat/
    [id].tsx             # Main chat screen (handles both new and existing chats)
  models.tsx             # Model download/selection screen

components/
  sidebar.tsx            # Slide-out sidebar with conversation history

services/
  llamaService.ts         # Model loading + streaming inference
  modelRepo.ts             # Downloaded model metadata (SQLite)
  conversationRepo.ts       # Conversation CRUD (SQLite)
  messageRepo.ts             # Message CRUD (SQLite)
  modelFileService.ts         # Model file download/paths
  modelEvents.ts                # Pub/sub for model list updates

db/
  client.ts               # SQLite database instance + init
  migrations.ts             # Table creation/migrations
  schema.ts                   # SQL schema definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS recommended)
- Expo CLI (`npx expo` — no global install needed)
- iOS: Xcode + a simulator or physical device
- Android: Android Studio + an emulator or physical device

> ⚠️ `llama.rn` requires native code, so this app **will not run in Expo Go**. You'll need to build a development client.

### Installation

```bash
# Clone the repo
git clone https://github.com/khanalankitt/mobile-llm-chat.git
cd mobile-llm-chat

# Install dependencies
npm install

# Build and run a development client
npx expo run:ios
# or
npx expo run:android
```

### First run

1. Open the app and go to the **Models** tab (via the sidebar)
2. Download a GGUF model of your choice
3. Return to the chat screen, select the downloaded model, and start chatting

## 🗄️ Database

Conversations and messages are stored locally in SQLite:

- **`conversations`** — id, title, timestamps
- **`messages`** — id, conversationId, role (`user`/`assistant`), content, timestamp
- **`models`** — downloaded model metadata (path, size, RAM requirements)

Migrations run automatically on app start via `initializeDatabase()` in `db/client.ts`.

## 📌 Known Limitations

- Conversation history sent to the model is capped at the last 12 messages per request to stay within the model's context window (`n_ctx: 2048` by default) — older messages remain saved and visible in the UI but drop out of the model's active memory.
- Markdown rendering supports common formatting (bold, italic, inline code, code blocks, headers, lists) but not tables, links, or nested lists.
- Only one model can be loaded at a time; switching models unloads the previous one.

## 🤝 Contributing

This is a personal/learning project — issues and PRs welcome if you'd like to extend it (e.g. RAG support, model quantization options, multi-turn context summarization for longer chats).

## 📄 License

_Add your license here (MIT, Apache 2.0, etc.)_

## 👤 Author

**Ankit Khanal**
GitHub: [@khanalankitt](https://github.com/khanalankitt)
