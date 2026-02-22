# 🧘 ZenMarkdown Editor

A modern, distraction-free Markdown editor built for writers, developers, and note-takers. Experience real-time preview, synchronized scrolling, advanced syntax support, and seamless export options in a highly optimized, sleek interface.

## ✨ Features

- **Real-Time Live Preview**: Write Markdown and instantly see the beautifully rendered output.
- **Advanced Syntax Support**: Full parsing support for tables, task lists, strikethrough, and extended Markdown capabilities.
- **Rich Media & Formatting**:
  - **Math Equations**: Render complex mathematical formulas natively using KaTeX.
  - **Diagrams & Charts**: Create flowcharts, sequence diagrams, and more using Mermaid.js.
  - **Emojis**: Built-in support for emoji shortcodes.
  - **Frontmatter**: Seamlessly manage document metadata with YAML frontmatter parsing.
- **Developer Features**: Accurate and fast syntax highlighting for code blocks in dozens of programming languages.
- **Synchronized Scrolling**: The editor and preview panes remain perfectly aligned as you scroll through your documents.
- **Persistent Auto-Save**: Never lose a thought. Your content is automatically and safely saved to your browser's local storage.
- **Customizable Workspace**:
  - Toggle between carefully crafted Light and Dark themes.
  - Fully resizable split panels for adjusting your writing environment.
- **Robust Export & Import**:
  - Generate print-ready **PDFs** directly from your markdown.
  - Download raw **Markdown (.md)** source files.
  - Load existing `.md` files straight into your editor.
- **Security-First Engine**: Strict AST-based HTML sanitization ensures you are protected from XSS vulnerabilities when rendering web content.

## 🛠️ Tech Stack

- **Core Framework**: [Next.js](https://nextjs.org/) (React 19, App Router)
- **Text Editor**: [CodeMirror 6](https://codemirror.net/) with advanced extensions
- **Markdown Engine**: [React Markdown](https://remarkjs.github.io/react-markdown/) ecosystem (Remark / Rehype plugins)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

Follow these steps to run the application locally on your machine:

### Prerequisites

Ensure you have the following installed:
- Node.js (v18 or higher recommended)
- A package manager (npm, yarn, pnpm, or bun)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd zen-markdown-editor
   ```

2. Install dependencies:
   ```bash
   npm install
   # or yarn install / pnpm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or yarn dev / pnpm dev
   ```

4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

## 📖 Usage Guide

- **Quick Formatting**: Utilize the interactive toolbar at the top to quickly apply styles (Bold, Italic, Blockquotes, Code, etc.) without writing syntax manually.
- **Keyboard Shortcuts**: Benefit from standard text editing shortcuts designed for power users.
- **Layout Adjustment**: Drag the vertical separator between the active editor and the preview panel to customize width dynamically.
- **File Management**: Use the intuitive workspace actions to upload external `.md` files, or use the export menu to save your work locally.

## 🤝 Contributing

Contributions, bug reports, and feature requests are very welcome! If you have ideas for improvements, feel free to open an issue or submit a pull request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---
*Built with focus, speed, and simplicity in mind.*
