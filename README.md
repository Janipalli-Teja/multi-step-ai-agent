# 🤖 AI Assistant (Autonomous Multi-Step Agent)

An advanced, full-stack autonomous AI agent that uses the **ReAct (Reasoning + Acting)** framework to automatically decompose tasks, choose tools, and execute them step-by-step.

This project connects a complex Express/Node.js backend agent to a beautiful, fully responsive React frontend dashboard via Server-Sent Events (SSE) to visualize the agent's thought process in real-time.

**🌐 Live Demo:** [https://multi-step-ai-agent-afkwncvsb-tejas-projects-3557902a.vercel.app/](https://multi-step-ai-agent-afkwncvsb-tejas-projects-3557902a.vercel.app/)

---

## ✨ Core Features
* **Task Decomposition**: Breaks complex, high-level user tasks into a linear array of specific execution steps.
* **ReAct Execution Engine**: Dynamically loops through a `Goal → Think → Act → Observe` pipeline for every single step.
* **Self-Correcting Retry Logic**: If an action fails, the underlying engine automatically grabs the error specifically, feeds it explicitly back into the prompt, and has the LLM self-correct its JSON inputs (up to 3 limits).
* **Dual-Layer Memory**: Dedicated ephemeral short-term memory per-task session (context awareness) and long-term memory.
* **Real-time SSE Dashboard**: Beautifully animated dashboard built with **React & Tailwind CSS** streaming live step progress directly from the backend. 

---

## 🛠️ Tech Stack
* **Frontend:** React, TypeScript, Vite, Tailwind CSS v3
* **Backend:** Node.js, Express, TypeScript, Server-Sent Events (SSE)
* **LLM:** Google Gemini API (`gemini-2.5-flash`)
* **Framework:** Custom ReAct built from scratch without external orchestrators (LangChain, etc.)

---

## 🧑‍💻 Quickstart

### 1. Prerequisites
You will need Node.js installed and a [Google Gemini API Key](https://aistudio.google.com/app/apikey).

### 2. Environment Variables
In the `server` folder, create a `.env` file and set the following parameter:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 3. Installation & Running
The frontend and backend run as distinct services. You must start them in two separate terminal tabs.

**Terminal 1 (Backend - Agent Logic):**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 (Frontend - Agent Dashboard):**
```bash
cd client
npm install
npm run dev
```

The application UI will now be live on React at `http://localhost:5173`.

---

## 🧩 Modifying & Adding Tools
Currently, the LLM maps tools to explicitly defined capabilities. The standard simulated tools are:
* 📅 `calendar`
* 📧 `email_sender`
* 🔍 `search`
* 🧠 `memory`

**To build or edit a custom tool:**
Navigate to `server/src/tools/index.ts`. All tools are strict implementation maps matching the `ToolDefinition` payload containing logic and JSON-schema parameters so the LLM explicitly understands your tool's capability!

---

## 🤝 Project Structure
```
AgenticAI/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/         # Dashboard, Inputs, Memory Panels, Step Cards 
│   │   ├── services/api.ts     # Dedicated REST/SSE fetch hooks
│   │   └── App.tsx             # Main orchestrated UI views
│   └── tailwind.config.js      # Advanced Dark UI and Animations
└── server/                     # Backend API & Engine
    ├── src/
    │   ├── agent/
    │   │   ├── planner.ts      # LLM Prompts, Generation, Decomposition Logic
    │   │   └── execution.ts    # Central ReAct Engine Stream
    │   ├── memory/             # In-memory dual-layer storage module
    │   ├── tools/              # Hardcoded executable tool functions
    │   └── index.ts            # Core Express HTTP Server Routing
    └── package.json            
```
