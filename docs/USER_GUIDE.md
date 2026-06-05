# LOC-AI: Official User Guide

## 1. Introduction
LOC-AI is a professional-grade, dual-engine AI coding assistant designed to run directly on your desktop. It offers two distinct modes:
*   **BUNKER MODE (Offline)**: Secure, private, and runs entirely on your local hardware using the Ollama engine. No internet required.
*   **GOD MODE (Online)**: Connects to the ultra-fast Groq Cloud API (Llama-3.3-70B) for complex reasoning and high-speed architecture planning.

## 2. Installation Guide

### Step 1: Install the App
1. Download the installer file: `LOC-AI Setup 1.0.0.exe`.
2. Double-click to run it.
3. If Windows shows a "Protected your PC" warning (common for new indie apps), click **"More Info" -> "Run Anyway"**.
4. When asked, select **"Install for Anyone who uses this computer (All Users)"**.
5. Launch LOC-AI from your Desktop shortcut.

### Step 2: Activate Offline Brain (Required for Bunker Mode)
LOC-AI needs a "Brain" to function offline.
1. Download Ollama from [ollama.com](https://ollama.com).
2. Install it.
3. Open your Command Prompt (cmd) or Terminal.
4. Run this exact command to download the coding model:
   ```bash
   ollama run qwen2.5-coder:1.5b
   ```
5. Done! Bunker Mode is now active.

### Step 3: Activate Online Brain (Required for God Mode)
1. Open LOC-AI.
2. Click the **"⚡ GOD MODE"** button in the sidebar.
3. Click the **"⚙️ SETTINGS"** button.
4. Enter your Groq API Key. *(Get your own free key at: [console.groq.com](https://console.groq.com))*
5. Click **SAVE CONFIGURATION**.

## 3. Features & Usage

### 🧠 Smart Chat & Memory
*   LOC-AI remembers the last 6 messages of your conversation, allowing for natural, continuous dialogue.
*   **Sidebar History**: Click on any past chat in the sidebar to instantly reload that session.
*   **Delete**: Hover over any chat in the sidebar and click the Trash Bin icon to delete it permanently.

### 👁️ Project Vision (File Analysis)
*   **Drag & Drop**: Drag any code file (`.py`, `.js`, `.txt`), **document (`.pdf`)**, or **image/screenshot (`.png`, `.jpg`)** directly onto the app window. LOC-AI will instantly scan and extract the text from the files!
*   **Blue Chip**: A blue tag will appear showing the file is attached.
*   **Analyze**: Type your question (e.g., "Find the bug in this screenshot") and hit Enter. The AI will read the extracted text and answer.

### 🎨 Cyber-Glass Interface
*   Enjoy a distraction-free, high-contrast dark mode designed for late-night coding sessions.
*   Code blocks feature syntax highlighting and a one-click **"COPY"** button.
