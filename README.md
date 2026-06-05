<div align="center">
  <img src="https://raw.githubusercontent.com/lochanachamod/LOC-AI/main/logo.png" alt="LOC-AI Logo" width="150" height="150">

  # LOC-AI

  <p align="center">
    <img src="https://img.shields.io/badge/version-2.0.0-blue.svg" alt="Version">
    <img src="https://img.shields.io/badge/platform-Windows%20|%20macOS%20|%20Linux-lightgrey.svg" alt="Platform">
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
    <img src="https://img.shields.io/github/stars/lochanachamod/LOC-AI?style=social" alt="GitHub stars">
  </p>

  <p><strong>The Dual-Engine Coding Assistant for Professional Developers</strong></p>

  <p>
    <a href="https://github.com/lochanachamod/LOC-AI/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT">
    </a>
    <a href="https://nodejs.org/">
      <img src="https://img.shields.io/badge/Node.js-18.x-green.svg" alt="Node.js version">
    </a>
    <a href="https://www.electronjs.org/">
      <img src="https://img.shields.io/badge/Electron-Latest-blue" alt="Electron">
    </a>
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a> •
    <a href="#contributing">Contributing</a> •
    <a href="#contact">Contact</a>
  </p>
</div>

---

## ⚡ Overview

LOC-AI solves the critical problem of relying solely on cloud-based AI by integrating a robust offline engine. Built with Electron and Node.js, LOC-AI provides lightning-fast cloud inference alongside complete offline privacy, wrapped in a beautiful **Cyber-Glass Interface**.

### 🌟 Dual-Engine Technology

*   **God Mode (Online)**: Connects directly to the Groq API (Llama-3.3-70B), offering the world's fastest inference speeds for complex architectural problems and modern framework knowledge.
*   **Bunker Mode (Offline)**: Utilizes a local Ollama instance running `qwen2.5-coder`, ensuring total privacy and functionality without an internet connection.

---

## 🚀 Features

*   **Cyber-Glass Interface**: A custom-built UI featuring neon aesthetics, glassmorphism, and advanced typography designed for readability and visual appeal.
*   **Drag-and-Drop Analysis**: Seamlessly drag code files (`.py`, `.js`, `.txt`), **documents (`.pdf`)**, or **images (`.png`, `.jpg`)** directly into the chat. LOC-AI instantly extracts the text and analyzes it.
*   **Context Memory**: Intelligently remembers the last 6 messages to maintain conversational flow.
*   **System Persona Customization**: Tailor the AI's behavior via the settings panel.
*   **Offline First**: Total privacy when you need it using Bunker Mode.

---

## 🛠️ Installation & Setup

### Prerequisites
*   [Node.js](https://nodejs.org/)
*   [Ollama](https://ollama.com/) (For Bunker Mode)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/lochanachamod/LOC-AI.git
   cd LOC-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

### Building the Executable

To package LOC-AI into a standalone Windows installer (`.exe`):

```bash
npm run build
```
The compiled installer will be available in the `dist` directory.

---

## 💡 Usage

### Switching Modes
*   **🛡️ Bunker Mode**: Activated by default (shield icon). 
    > **⚠️ IMPORTANT:** You must ensure the **Ollama application is actively running in your system tray** (background) whenever you want to use Bunker Mode. If Ollama is closed, the offline AI will not respond.
*   **⚡ God Mode**: Click the lightning bolt icon. Enter your Groq API key in the settings panel to activate.

### File Analysis
1. Drag and drop any supported code file onto the chat window. A blue chip will appear indicating the file is loaded.
2. Type your question (e.g., *"Find the bug"* or *"Refactor this module"*).
3. LOC-AI transparently injects the file context into the prompt for accurate analysis.

---

## 🤝 Contributing

Contributions make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please review the [Contributing Guidelines](CONTRIBUTING.md) for more details.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📬 Contact

**Lochana Chamod** 
*   Email: [lochanachamod7@gmail.com](mailto:lochanachamod7@gmail.com)
*   Alternative Email: [lochanachamod3@gmail.com](mailto:lochanachamod3@gmail.com)

<p align="center">
  Built with ❤️ by Lochana Chamod
</p>
