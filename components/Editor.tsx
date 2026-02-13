"use client";

import React, { useMemo } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { search } from "@codemirror/search";
import { autocompletion } from "@codemirror/autocomplete";
import { SelectionRange } from "@/hooks/use-editor";

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
    onScroll?: () => void;
    onSelectionChange?: (selection: SelectionRange) => void;
    editorRef: React.RefObject<ReactCodeMirrorRef | null>;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, onScroll, onSelectionChange, editorRef }) => {
    const extensions = useMemo(
        () => [
            markdown({ base: markdownLanguage, codeLanguages: languages }),
            search({ top: true }),
            autocompletion(),
            EditorView.lineWrapping,
            EditorView.theme({
                "&": { height: "100%", fontSize: "16px" },
                ".cm-content": {
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    padding: "20px 0"
                },
                ".cm-scroller": {
                    outline: "none !important"
                },
                ".cm-search": {
                    backgroundColor: "var(--muted)",
                    borderBottom: "1px solid var(--border)",
                },
                ".cm-textfield": {
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    color: "inherit",
                    borderRadius: "4px",
                    padding: "2px 4px",
                }
            }),
            EditorView.domEventHandlers({
                scroll: () => {
                    if (onScroll) onScroll();
                },
            }),
            EditorView.updateListener.of((update) => {
                if ((update.selectionSet || update.docChanged) && onSelectionChange) {
                    const range = update.state.selection.main;
                    const fromLine = update.state.doc.lineAt(range.from).number;
                    const toLine = update.state.doc.lineAt(range.to).number;
                    onSelectionChange({
                        fromLine,
                        toLine,
                        fromOffset: range.from,
                        toOffset: range.to
                    });
                }
            }),
        ],
        [onScroll, onSelectionChange]
    );

    return (
        <div className="h-full w-full overflow-hidden border-r border-border bg-[#282c34]">
            <CodeMirror
                ref={editorRef}
                value={value}
                height="100%"
                theme={oneDark}
                extensions={extensions}
                onChange={onChange}
                basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    highlightSelectionMatches: true,
                    searchKeymap: true,
                }}
                className="h-full"
            />
        </div>
    );
};

export default Editor;
