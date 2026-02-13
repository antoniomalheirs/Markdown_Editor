"use client";

import { useState, useEffect, useCallback } from "react";
import { APP_CONFIG } from "@/lib/constants";

export interface SelectionRange {
    fromLine: number;
    toLine: number;
    fromOffset: number;
    toOffset: number;
}

export function useEditor() {
    const [content, setContent] = useState<string>("");
    const [isMounted, setIsMounted] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [selection, setSelection] = useState<SelectionRange | null>(null);

    // Load initial content and theme
    useEffect(() => {
        const saved = localStorage.getItem(APP_CONFIG.storageKey);
        const savedTheme = localStorage.getItem("zen-theme");
        setContent(saved || APP_CONFIG.defaultContent);
        setIsDark(savedTheme === "dark" || (window.matchMedia("(prefers-color-scheme: dark)").matches && !savedTheme));
        setIsMounted(true);
    }, []);

    // Theme effect
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("zen-theme", isDark ? "dark" : "light");
    }, [isDark]);

    // Auto-save logic (Debounced)
    useEffect(() => {
        if (!isMounted) return;
        const handler = setTimeout(() => {
            localStorage.setItem(APP_CONFIG.storageKey, content);
        }, 1000);
        return () => clearTimeout(handler);
    }, [content, isMounted]);

    const handleChange = useCallback((value: string) => {
        setContent(value);
    }, []);

    const handleAction = useCallback((type: string, editorRef: React.RefObject<any>) => {
        const view = editorRef.current?.view;
        if (!view) return;

        const { state, dispatch } = view;
        const { from, to } = state.selection.main;
        const selectionText = state.doc.sliceString(from, to);

        let substitution = "";
        switch (type) {
            case "h1": substitution = `# ${selectionText}`; break;
            case "h2": substitution = `## ${selectionText}`; break;
            case "h3": substitution = `### ${selectionText}`; break;
            case "bold": substitution = `**${selectionText}**`; break;
            case "italic": substitution = `*${selectionText}*`; break;
            case "underline": substitution = `<u>${selectionText}</u>`; break;
            case "strikethrough": substitution = `~~${selectionText}~~`; break;
            case "highlight": substitution = `==${selectionText}==`; break;
            case "inline-code": substitution = `\`${selectionText}\``; break;
            case "quote": substitution = `> ${selectionText}`; break;
            case "hr": substitution = `\n---\n`; break;
            case "code": substitution = `\`\`\`\n${selectionText}\n\`\`\``; break;
            case "link": substitution = `[${selectionText || "link"}](https://)`; break;
            case "image": substitution = `![${selectionText || "alt"}](https://)`; break;
            case "ul": substitution = `- ${selectionText}`; break;
            case "ol": substitution = `1. ${selectionText}`; break;
            case "task": substitution = `- [ ] ${selectionText}`; break;
            case "table": substitution = `\n| Col 1 | Col 2 |\n| --- | --- |\n| Item | Item |\n`; break;
            case "export-md":
                const blob = new Blob([content], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "document.md";
                a.click();
                break;
            case "import":
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".md";
                input.onchange = (e: any) => {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (re) => setContent(re.target?.result as string);
                    reader.readAsText(file);
                };
                input.click();
                break;
            case "export-pdf":
                window.print();
                break;
        }

        if (substitution) {
            dispatch({
                changes: { from, to, insert: substitution },
                selection: { anchor: from + substitution.length }
            });
            view.focus();
        }
    }, [content]);

    const handleImageDrop = useCallback((file: File, editorRef: React.RefObject<any>) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            const view = editorRef.current?.view;
            if (view) {
                const { from } = view.state.selection.main;
                view.dispatch({
                    changes: { from, insert: `![image](${base64})\n` }
                });
                view.focus();
            }
        };
        reader.readAsDataURL(file);
    }, []);

    return {
        content,
        setContent,
        handleChange,
        handleAction,
        handleImageDrop,
        isMounted,
        isDark,
        selection,
        setSelection,
        toggleTheme: () => setIsDark(!isDark),
    };
}
