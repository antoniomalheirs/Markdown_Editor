# 🧘 ZenMarkdown Editor

A modern, distraction-free Markdown editor built for writers and developers. Experience real-time preview, synchronized scrolling, and seamless export options in a sleek interface.

## ✨ Features

- **Real-time Preview**: Write Markdown and see the result instantly with GitHub Flavored Markdown (GFM) support.
- **Rich Syntax Support**: Includes support for Math (KaTeX), Emojis, and Syntax Highlighting for code blocks.
- **Synchronized Scrolling**: Smoothly scroll between the editor and preview panes without losing your place.
- **Auto-Save**: Never lose your work. Content is automatically saved to your browser's local storage (debounced for performance).
- **Themes**: Switch between Light and Dark modes to suit your environment.
- **Export Options**:
  - Export to **PDF** (print-ready layout).
  - Export to **Markdown (.md)** file.
- **Import**: Load existing `.md` files directly into the editor.
- **Drag & Drop Images**: Easily insert images by dragging them into the editor.
- **Secure**: Built-in HTML sanitization to prevent XSS attacks while allowing safe HTML rendering.
- **Responsive Design**: Works on desktop and tablets with resizable panels.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Editor**: [CodeMirror 6](https://codemirror.net/)
- **Markdown**: [React Markdown](https://github.com/remarkjs/react-markdown)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Math**: [KaTeX](https://katex.org/)

## 🚀 Getting Started

To run this project locally, follow these steps:

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, or pnpm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/zen-markdown-editor.git
    cd zen-markdown-editor
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    # or
    yarn dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

-   **Toolbar**: Use the top toolbar for quick formatting (Bold, Italic, Lists, Code Blocks, etc.).
-   **Shortcuts**: Supports standard markdown shortcuts.
-   **Panel Resizing**: Drag the separator between editor and preview to adjust width.
-   **Exporting**: Click the download icon in the toolbar to save your file.

## 🛡️ Security

This project uses `rehype-sanitize` to clean HTML output, ensuring that rendered content is safe from Cross-Site Scripting (XSS) vulnerabilities.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
