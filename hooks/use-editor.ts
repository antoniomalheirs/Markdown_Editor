"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWorkspace } from "@/hooks/use-workspace";

export interface SelectionRange {
    fromLine: number;
    toLine: number;
    fromOffset: number;
    toOffset: number;
}

export function useEditor() {
    const { notes, activeNoteId, updateNote, migrateLegacyContent, setSaveStatus } = useWorkspace();

    // We maintain local content state for immediate Editor typing feedback, 
    // and sync it to the global workspace store using debounce.
    const [localContent, setLocalContent] = useState<string>("");
    const [previewContent, setPreviewContent] = useState<string>("");

    const activeNote = notes.find(n => n.id === activeNoteId);

    const [isMounted, setIsMounted] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [selection, setSelection] = useState<SelectionRange | null>(null);
    const [previewSelection, setPreviewSelection] = useState<SelectionRange | null>(null);

    const contentRef = useRef(localContent);
    contentRef.current = localContent;

    const selectionRef = useRef(selection);
    selectionRef.current = selection;

    // Throttle for Preview. Guarantees ~6fps UI updates during heavy typing (e.g. holding backspace)
    // without starving the main thread like useDeferredValue does.
    useEffect(() => {
        const interval = window.setInterval(() => {
            setPreviewContent(prev => prev === contentRef.current ? prev : contentRef.current);
            setPreviewSelection(prev => {
                if (prev === selectionRef.current) return prev;
                if (prev && selectionRef.current &&
                    prev.fromLine === selectionRef.current.fromLine &&
                    prev.toLine === selectionRef.current.toLine &&
                    prev.fromOffset === selectionRef.current.fromOffset &&
                    prev.toOffset === selectionRef.current.toOffset
                ) {
                    return prev;
                }
                return selectionRef.current ? { ...selectionRef.current } : null;
            });
        }, 150);
        return () => window.clearInterval(interval);
    }, []);

    // Keep a ref to the view so hotkeys can access it without causing re-renders
    const globalEditorRef = useRef<any>(null);

    // Initial mount and migration
    useEffect(() => {
        migrateLegacyContent();
        const savedTheme = localStorage.getItem("zen-theme");
        setIsDark(savedTheme === "dark" || (window.matchMedia("(prefers-color-scheme: dark)").matches && !savedTheme));
        setIsMounted(true);
    }, [migrateLegacyContent]);

    // Theme effect
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("zen-theme", isDark ? "dark" : "light");
    }, [isDark]);

    // Sync localContent when active note changes from outside (e.g. clicking sidebar)
    useEffect(() => {
        if (activeNote) {
            setLocalContent(activeNote.content);
            setPreviewContent(activeNote.content);
            contentRef.current = activeNote.content;
        } else {
            setLocalContent("");
            setPreviewContent("");
            contentRef.current = "";
        }
    }, [activeNoteId]); // Deliberately only depending on activeNoteId, not the whole activeNote object to prevent cursor jump loop

    // Auto-save logic (Debounced sync to Zustand)
    useEffect(() => {
        if (!isMounted || !activeNoteId) return;

        // If content matches, we are already saved (on load or after save)
        if (localContent === activeNote?.content) {
            setSaveStatus("saved");
            return;
        }

        // Content changed, we are waiting to save
        setSaveStatus("saving");

        const handler = setTimeout(() => {
            updateNote(activeNoteId, localContent);
            setSaveStatus("saved");
        }, 1000);

        return () => clearTimeout(handler);
    }, [localContent, isMounted, activeNoteId, updateNote, activeNote?.content, setSaveStatus]);

    const handleChange = useCallback((value: string) => {
        setLocalContent(value);
        contentRef.current = value;
    }, []);

    const handleAction = useCallback((type: string, editorRef: React.RefObject<any>) => {
        if (editorRef.current) {
            globalEditorRef.current = editorRef.current;
        }
        const view = editorRef.current?.view || globalEditorRef.current?.view;
        if (!view) return;

        const { state, dispatch } = view;
        const { from, to } = state.selection.main;
        const selectionText = state.doc.sliceString(from, to);

        // Helper for inline toggles
        const toggleInline = (mark: string) => {
            if (selectionText) {
                const isWrapped = selectionText.startsWith(mark) && selectionText.endsWith(mark) && selectionText.length >= mark.length * 2;
                if (isWrapped) {
                    return selectionText.slice(mark.length, -mark.length);
                } else {
                    return `${mark}${selectionText}${mark}`;
                }
            } else {
                return `${mark}texto${mark}`;
            }
        };

        // Helper for block prefixes (affects the entire line)
        const applyBlockPrefix = (prefix: string) => {
            const line = state.doc.lineAt(from);
            const cleanText = line.text.replace(/^(#{1,6}\s+|-\s+\[[ x]\]\s+|-\s+|\d+\.\s+|>\s+)/, '');
            const isAlreadyPrefix = line.text.startsWith(prefix) && line.text.length === cleanText.length + prefix.length;

            // Toggle off if already matching
            if (isAlreadyPrefix) {
                return { changes: { from: line.from, to: line.to, insert: cleanText } };
            }

            return { changes: { from: line.from, to: line.to, insert: `${prefix}${cleanText}` } };
        };

        let txChanges: any = null;
        let finalSelection: any = null;

        switch (type) {
            case "h1": txChanges = applyBlockPrefix("# ").changes; break;
            case "h2": txChanges = applyBlockPrefix("## ").changes; break;
            case "h3": txChanges = applyBlockPrefix("### ").changes; break;
            case "ul": txChanges = applyBlockPrefix("- ").changes; break;
            case "ol": txChanges = applyBlockPrefix("1. ").changes; break;
            case "task": txChanges = applyBlockPrefix("- [ ] ").changes; break;
            case "quote": txChanges = applyBlockPrefix("> ").changes; break;
            case "bold":
                const bolded = toggleInline("**");
                txChanges = { from, to, insert: bolded };
                finalSelection = { anchor: from + bolded.length };
                break;
            case "italic":
                const italiced = toggleInline("*");
                txChanges = { from, to, insert: italiced };
                finalSelection = { anchor: from + italiced.length };
                break;
            case "strikethrough":
                const striked = toggleInline("~~");
                txChanges = { from, to, insert: striked };
                finalSelection = { anchor: from + striked.length };
                break;
            case "highlight":
                const highlighted = toggleInline("==");
                txChanges = { from, to, insert: highlighted };
                finalSelection = { anchor: from + highlighted.length };
                break;
            case "inline-code":
                const inlined = toggleInline("`");
                txChanges = { from, to, insert: inlined };
                finalSelection = { anchor: from + inlined.length };
                break;
            case "underline":
                const uIsWrapped = selectionText.startsWith("<u>") && selectionText.endsWith("</u>");
                const uText = uIsWrapped ? selectionText.slice(3, -4) : `<u>${selectionText || "sublinhado"}</u>`;
                txChanges = { from, to, insert: uText };
                finalSelection = { anchor: from + uText.length };
                break;
            case "hr": txChanges = { from: state.doc.lineAt(from).to, to: state.doc.lineAt(from).to, insert: `\n---\n` }; break;
            case "code": txChanges = { from: state.doc.lineAt(from).to, to: state.doc.lineAt(from).to, insert: `\n\`\`\`\n${selectionText || "código..."}\n\`\`\`\n` }; break;
            case "link": txChanges = { from, to, insert: `[${selectionText || "link"}](https://)` }; break;
            case "image": txChanges = { from, to, insert: `![${selectionText || "alt"}](https://)` }; break;
            case "table": txChanges = { from: state.doc.lineAt(from).to, to: state.doc.lineAt(from).to, insert: `\n| Coluna 1 | Coluna 2 |\n| -------- | -------- |\n| Item     | Valor    |\n` }; break;
            case "callout-info": txChanges = { from: state.doc.lineAt(from).to, to: state.doc.lineAt(from).to, insert: `\n> [!INFO]\n> ${selectionText || "Informação importante"}\n` }; break;
            case "callout-tip": txChanges = { from: state.doc.lineAt(from).to, to: state.doc.lineAt(from).to, insert: `\n> [!TIP]\n> ${selectionText || "Dica útil"}\n` }; break;
            case "callout-warning": txChanges = { from: state.doc.lineAt(from).to, to: state.doc.lineAt(from).to, insert: `\n> [!WARNING]\n> ${selectionText || "Aviso importante"}\n` }; break;
            case "callout-danger": txChanges = { from: state.doc.lineAt(from).to, to: state.doc.lineAt(from).to, insert: `\n> [!DANGER]\n> ${selectionText || "Ação destrutiva"}\n` }; break;
            case "toc": txChanges = { from: state.doc.lineAt(from).to, to: state.doc.lineAt(from).to, insert: `\n> [!TOC]\n` }; break;
            case "toggle": txChanges = { from: state.doc.lineAt(from).to, to: state.doc.lineAt(from).to, insert: `\n<details>\n<summary>Título do Toggle</summary>\n\nConteúdo escondido aqui...\n\n</details>\n` }; break;
            case "frontmatter": txChanges = { from: 0, to: 0, insert: `---\ntitle: ${activeNote?.title || "Novo Arquivo"}\nstatus: In Progress\ntags:\n  - rascunho\n---\n\n` }; break;
            case "export-md":
                const blob = new Blob([localContent], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = activeNote?.title || "document.md";
                a.click();
                URL.revokeObjectURL(url);
                break;
            case "import":
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".md";
                input.onchange = (e: any) => {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (re) => {
                        const newContent = re.target?.result as string;
                        setLocalContent(newContent);
                        if (activeNoteId) updateNote(activeNoteId, newContent);
                    };
                    reader.readAsText(file);
                };
                input.click();
                break;
            case "export-pdf":
                window.print();
                break;
        }

        if (txChanges) {
            dispatch({
                changes: txChanges,
                selection: finalSelection || { anchor: txChanges.insert ? (txChanges.from + txChanges.insert.length) : state.selection.main.anchor }
            });
            view.focus();
        }
    }, [localContent, activeNote, activeNoteId, updateNote]);

    const handleImageDrop = useCallback((file: File, editorRef: React.RefObject<any>) => {
        const MAX_SIZE_MB = 2;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            alert(`Para otimizar o navegador, a imagem deve ser menor que ${MAX_SIZE_MB}MB.`);
            return;
        }
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

    // Global Hotkeys Listener
    useEffect(() => {
        if (!isMounted) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Only trigger if a modifier (Ctrl/Cmd) is pressed
            if (!e.ctrlKey && !e.metaKey) return;

            let actionType = null;
            const key = e.key.toLowerCase();

            switch (key) {
                case 'b':
                    actionType = "bold";
                    break;
                case 'i':
                    actionType = "italic";
                    break;
                case 'k':
                    actionType = "link";
                    break;
                // Optional: add more like 'u' for underline, etc.
            }

            if (actionType) {
                e.preventDefault();
                // Pass an empty ref, handleAction will use globalEditorRef fallback
                handleAction(actionType, { current: globalEditorRef.current });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleAction, isMounted]);

    return {
        content: localContent, // Exporting localContent as 'content' to maintain API compatibility with page.tsx
        previewContent,
        handleChange,
        handleAction,
        handleImageDrop,
        isMounted,
        isDark,
        selection,
        previewSelection,
        setSelection,
        toggleTheme: () => setIsDark(!isDark),
    };
}
