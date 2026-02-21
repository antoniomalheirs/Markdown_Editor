"use client";

import React, { useMemo, useEffect, useState } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { EditorView, dropCursor, keymap, lineNumbers, highlightActiveLineGutter } from "@codemirror/view";
import { foldGutter, syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { EditorState, Extension } from "@codemirror/state";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { search } from "@codemirror/search";
import { autocompletion } from "@codemirror/autocomplete";
import { SelectionRange, useEditor } from "@/hooks/use-editor";
import { slashCommandPlugin, slashCommandState, SlashCommandState, SLASH_ACTIONS } from "./markdown/slash-commands";
import { GripVertical, Plus, Trash2, Copy } from "lucide-react";
import { FloatingMenu } from "./FloatingMenu";

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
    onScroll?: () => void;
    onSelectionChange?: (selection: SelectionRange | ((prev: SelectionRange | null) => SelectionRange | null)) => void;
    editorRef: React.RefObject<ReactCodeMirrorRef | null>;
    isDark: boolean;
    handleAction: (type: string, ref: any) => void;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, onScroll, onSelectionChange, editorRef, isDark, handleAction }) => {

    const [slashState, setSlashState] = useState<SlashCommandState | null>(null);
    const [slashCoords, setSlashCoords] = useState<{ top?: number, bottom?: number, left: number } | null>(null);
    const [menuCoords, setMenuCoords] = useState<{ top: number, left: number } | null>(null);

    // Block handle (Notion-style) state
    const [blockCoords, setBlockCoords] = useState<{ top: number, pos: number, height: number } | null>(null);
    const [isHoveringBlockMenu, setIsHoveringBlockMenu] = useState(false);
    const [blockMenuOpen, setBlockMenuOpen] = useState<{ top: number, left: number, pos: number } | null>(null);

    // DEBUGGER STATE
    const [debugState, setDebugState] = useState<any>(null);

    const customThemeDocs = useMemo(() => {
        return HighlightStyle.define([
            { tag: t.heading1, fontSize: "2.4em", fontWeight: "bold", display: "inline-block", paddingTop: "0.5em", paddingBottom: "0.2em", color: "inherit", letterSpacing: "-0.02em" },
            { tag: t.heading2, fontSize: "1.8em", fontWeight: "bold", display: "inline-block", paddingTop: "0.5em", paddingBottom: "0.2em", color: "inherit", letterSpacing: "-0.01em" },
            { tag: t.heading3, fontSize: "1.4em", fontWeight: "bold", display: "inline-block", paddingTop: "0.4em", color: "inherit" },
            { tag: t.heading4, fontSize: "1.2em", fontWeight: "bold", display: "inline-block", paddingTop: "0.2em", color: "inherit" },
            { tag: t.heading5, fontSize: "1.1em", fontWeight: "bold", display: "inline-block", paddingTop: "0.2em", color: "inherit" },
            { tag: t.heading6, fontSize: "1.0em", fontWeight: "bold", display: "inline-block", color: "inherit", opacity: 0.7 },
            { tag: [t.monospace, t.processingInstruction], fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace', fontSize: "0.9em", borderRadius: "4px", padding: "0.1em 0.2em" },
            { tag: t.quote, borderLeft: "4px solid var(--border)", paddingLeft: "16px", color: "var(--muted-foreground)", fontStyle: "italic", display: "inline-block", margin: "4px 0" },
        ]);
    }, []);

    const extensions = useMemo(
        () => [
            markdown({ base: markdownLanguage, codeLanguages: languages }),
            search({ top: true }),
            autocompletion(),
            syntaxHighlighting(customThemeDocs),
            slashCommandState,
            slashCommandPlugin((actionId, view) => {
                // When an action is selected from the slash menu, trigger it via the hook
                handleAction(actionId, { current: { view } } as any);
            }),
            EditorView.lineWrapping,
            EditorView.theme({
                "&": { height: "100%", fontSize: "16px", backgroundColor: "transparent", color: "inherit" },
                ".cm-content": {
                    fontFamily: 'inherit',
                    padding: "24px 32px 64px 32px"
                },
                ".cm-scroller": {
                    outline: "none !important",
                    overflow: "auto !important",
                    fontFamily: 'inherit',
                    lineHeight: "1.6",
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
                },
                ".cm-activeLine": {
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(234, 236, 240, 0.5)"
                },
                ".cm-gutters": {
                    backgroundColor: isDark ? "#0d1117" : "#ffffff",
                    color: isDark ? "#6e7681" : "#6e7781",
                    borderRight: isDark ? "1px solid #30363d" : "1px solid #d0d7de",
                },
                ".cm-activeLineGutter": {
                    backgroundColor: "transparent",
                    color: isDark ? "#c9d1d9" : "#24292f"
                }
            }),
            EditorView.domEventHandlers({
                scroll: () => {
                    if (onScroll) onScroll();
                },
                mousemove: (e, view) => {
                    // Find which line we are currently hovering over
                    const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
                    if (pos !== null) {
                        try {
                            const line = view.state.doc.lineAt(pos);
                            const lineBlock = view.lineBlockAt(line.from);
                            const coords = view.coordsAtPos(lineBlock.from);
                            if (coords) {
                                const editorEl = view.dom.getBoundingClientRect();
                                // Ensure we are actually hovering vertically within the line's boundaries
                                if (e.clientY >= coords.top && e.clientY <= coords.bottom) {
                                    const newTop = coords.top - editorEl.top;
                                    setBlockCoords(prev => {
                                        if (prev?.top === newTop && prev?.pos === line.from) return prev;
                                        return { top: newTop, pos: line.from, height: lineBlock.height };
                                    });
                                }
                            }
                        } catch (err) {
                            // ignore bounds errors
                        }
                    }
                },
                dragover: (e) => {
                    if (e.dataTransfer?.types.includes('application/x-zen-block')) {
                        e.preventDefault(); // allow drop
                    }
                },
                drop: (e, view) => {
                    const blockPosStr = e.dataTransfer?.getData('application/x-zen-block');
                    if (blockPosStr) {
                        e.preventDefault();
                        const sourcePos = parseInt(blockPosStr, 10);
                        const targetPos = view.posAtDOM(e.target as HTMLElement);

                        if (targetPos !== null && !isNaN(sourcePos)) {
                            try {
                                const sourceLine = view.state.doc.lineAt(sourcePos);
                                const to = sourceLine.number < view.state.doc.lines ? sourceLine.to + 1 : sourceLine.to;
                                const blockText = view.state.doc.sliceString(sourceLine.from, to);

                                const targetLine = view.state.doc.lineAt(targetPos);
                                if (sourceLine.number === targetLine.number) return true;

                                const insertText = blockText.endsWith('\n') ? blockText : blockText + '\n';

                                view.dispatch({
                                    changes: [
                                        { from: sourceLine.from, to: to, insert: "" },
                                        { from: targetLine.from, to: targetLine.from, insert: insertText }
                                    ]
                                });
                            } catch (err) { }
                            return true;
                        }
                    }
                    return false;
                }
            }),
            EditorView.updateListener.of((update) => {
                // Update selection state
                if (update.selectionSet || update.docChanged) {
                    const range = update.state.selection.main;

                    if (onSelectionChange) {
                        const fromLine = update.state.doc.lineAt(range.from).number;
                        const toLine = update.state.doc.lineAt(range.to).number;

                        setTimeout(() => {
                            onSelectionChange(prev => {
                                if (prev?.fromLine === fromLine && prev?.toLine === toLine && prev?.fromOffset === range.from && prev?.toOffset === range.to) return prev;
                                return {
                                    fromLine,
                                    toLine,
                                    fromOffset: range.from,
                                    toOffset: range.to
                                };
                            });
                        }, 0);
                    }

                    // Track Floating Menu coordinates independent of onSelectionChange
                    if (!range.empty && update.view.hasFocus) {
                        try {
                            // Get the coordinates of the start of the selection to position the menu
                            const coords = update.view.coordsAtPos(range.from);
                            if (coords) {
                                const editorRect = update.view.dom.getBoundingClientRect();
                                let calculatedTop = coords.top - editorRect.top - 45; // Default position above selection
                                if (calculatedTop < 10) {
                                    // If too high (e.g. line 1), render below the selection text
                                    calculatedTop = coords.bottom - editorRect.top + 10;
                                }

                                setMenuCoords({
                                    top: calculatedTop,
                                    left: coords.left - editorRect.left + (coords.right - coords.left) / 2 // Attempt to center slightly based on start
                                });
                            }
                        } catch (e) { }
                    } else {
                        setMenuCoords(null);
                    }

                    // For debugger purpose only
                    setDebugState({
                        empty: range.empty,
                        focus: update.view.hasFocus,
                        hasCoords: !!update.view.coordsAtPos(range.from)
                    });
                }

                // Track slash command state for React UI
                const currentSlashState = update.state.field(slashCommandState, false);
                if (currentSlashState) {
                    setSlashState(prev => {
                        if (prev === currentSlashState) return prev;
                        if (
                            prev?.active === currentSlashState.active &&
                            prev?.pos === currentSlashState.pos &&
                            prev?.query === currentSlashState.query &&
                            prev?.selectedIndex === currentSlashState.selectedIndex
                        ) {
                            return prev;
                        }
                        return currentSlashState;
                    });

                    if (currentSlashState.active && update.view) {
                        try {
                            const coords = update.view.coordsAtPos(currentSlashState.pos);
                            if (coords) {
                                // Subtract the editor UI offset to align it properly relative to the container
                                const editorEl = update.view.dom.getBoundingClientRect();
                                const newLeft = coords.left - editorEl.left;

                                // Check if there is enough space below for a ~250px tall menu
                                const spaceBelow = editorEl.bottom - coords.bottom;

                                if (spaceBelow < 250) {
                                    // Not enough space below, render ABOVE the cursor
                                    const newBottom = editorEl.bottom - coords.top + 5;
                                    setSlashCoords(prev => {
                                        if (prev?.bottom === newBottom && prev?.left === newLeft && prev.top === undefined) return prev;
                                        return { bottom: newBottom, left: newLeft };
                                    });
                                } else {
                                    // Plenty of space, render BELOW the cursor
                                    const newTop = coords.bottom - editorEl.top + 5;
                                    setSlashCoords(prev => {
                                        if (prev?.top === newTop && prev?.left === newLeft && prev.bottom === undefined) return prev;
                                        return { top: newTop, left: newLeft };
                                    });
                                }
                            }
                        } catch (e) {
                            // Ignore coordinate errors
                        }
                    } else {
                        setSlashCoords(prev => prev === null ? null : null);
                    }
                }
            }),
        ],
        [onScroll, onSelectionChange, isDark]
    );

    // Derived filtered actions based on state query
    const filteredActions = slashState?.active
        ? SLASH_ACTIONS.filter(a =>
            a.label.toLowerCase().includes(slashState.query.toLowerCase()) ||
            a.id.toLowerCase().includes(slashState.query.toLowerCase())
        )
        : [];

    return (
        <div
            className={"h-full w-full overflow-y-auto overflow-x-hidden relative custom-scrollbar " + (isDark ? "bg-[#0d1117]" : "bg-white")}
            onMouseLeave={() => {
                if (!isHoveringBlockMenu && !blockMenuOpen) setBlockCoords(null);
            }}
            onScroll={(e) => {
                if (onScroll) onScroll();
            }}
            onClick={(e) => {
                // Close block menu when clicking outside
                if (blockMenuOpen && !(e.target as Element).closest('.block-menu-dropdown')) {
                    setBlockMenuOpen(null);
                }
            }}
        >
            <CodeMirror
                ref={editorRef}
                value={value}
                height="100%"
                theme={isDark ? githubDark : githubLight}
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

            {/* Notion-style Block Drag Handle */}
            {blockCoords && (
                <div
                    className="absolute z-40 flex items-center justify-center gap-0.5 animate-in fade-in duration-150"
                    style={{
                        top: blockCoords.top,
                        left: -32,
                        height: Math.max(blockCoords.height, 24) // Vertical center to the line's height
                    }}
                    onMouseEnter={() => setIsHoveringBlockMenu(true)}
                    onMouseLeave={() => setIsHoveringBlockMenu(false)}
                >
                    <button
                        className="p-1 rounded hover:bg-muted/60 text-foreground/30 hover:text-foreground/80 transition-colors"
                        onClick={() => {
                            if (editorRef.current?.view) {
                                editorRef.current.view.dispatch({
                                    changes: { from: blockCoords.pos, insert: "\n" }
                                });
                            }
                        }}
                        title="Adicionar linha"
                    >
                        <Plus size={14} />
                    </button>
                    <button
                        draggable
                        onDragStart={(e) => {
                            if (editorRef.current?.view) {
                                const view = editorRef.current.view;
                                const line = view.state.doc.lineAt(blockCoords.pos);

                                // To grab the entire line including the newline break (if any)
                                const to = line.number < view.state.doc.lines ? line.to + 1 : line.to;
                                const blockText = view.state.doc.sliceString(line.from, to);

                                e.dataTransfer.setData('text/plain', blockText);
                                e.dataTransfer.setData('application/x-zen-block', line.from.toString());
                                e.dataTransfer.effectAllowed = 'move';

                                // Provide a visual hint
                                const dragImage = document.createElement('div');
                                dragImage.textContent = blockText.trim() ? blockText.trim().substring(0, 30) + '...' : 'Empty block';
                                dragImage.className = 'px-3 py-1 bg-background border shadow-md rounded text-sm whitespace-nowrap overflow-hidden max-w-[200px] pointer-events-none opacity-80';
                                document.body.appendChild(dragImage);
                                e.dataTransfer.setDragImage(dragImage, 0, 0);

                                setTimeout(() => document.body.removeChild(dragImage), 10);
                            }
                        }}
                        className="p-1 rounded hover:bg-muted/60 text-foreground/30 hover:text-foreground/80 cursor-grab active:cursor-grabbing transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (blockCoords !== null) { // Use blockCoords directly as it's already in scope
                                setBlockMenuOpen({
                                    top: blockCoords.top + 20,
                                    left: -32,
                                    pos: blockCoords.pos
                                });
                            }
                        }}
                        title="Opções do bloco (Arraste para mover)"
                    >
                        <GripVertical size={14} />
                    </button>
                </div>
            )}

            {/* Block Action Menu Dropdown */}
            {blockMenuOpen && (
                <div
                    className="absolute z-50 w-44 bg-popover border border-gray-200 dark:border-gray-800 rounded-md shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 block-menu-dropdown shadow-sm"
                    style={{
                        top: blockMenuOpen.top,
                        left: blockMenuOpen.left + 24 // Offset slightly from the trigger button
                    }}
                >
                    <div className="py-1">
                        <button
                            className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-muted flex items-center gap-2 text-foreground/80 transition-colors"
                            onClick={() => {
                                if (editorRef.current?.view) {
                                    const view = editorRef.current.view;
                                    const line = view.state.doc.lineAt(blockMenuOpen.pos);
                                    // Make sure we include a newline when duplicating
                                    const textToDuplicate = line.text + "\n";
                                    view.dispatch({
                                        changes: { from: line.from, insert: textToDuplicate }
                                    });
                                }
                                setBlockMenuOpen(null);
                            }}
                        >
                            <Copy size={14} className="text-foreground/60" /> Duplicar Bloco
                        </button>
                        <button
                            className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-red-500/10 hover:text-red-500 flex items-center gap-2 text-red-500/80 transition-colors"
                            onClick={() => {
                                if (editorRef.current?.view) {
                                    const view = editorRef.current.view;
                                    const line = view.state.doc.lineAt(blockMenuOpen.pos);
                                    const to = line.number < view.state.doc.lines ? line.to + 1 : line.to;
                                    view.dispatch({ changes: { from: line.from, to, insert: "" } });
                                }
                                setBlockMenuOpen(null);
                                setBlockCoords(null);
                            }}
                        >
                            <Trash2 size={14} /> Excluir Bloco
                        </button>
                    </div>
                </div>
            )}

            {/* Slash Command Popover Menu */}
            {slashState?.active && slashCoords && filteredActions.length > 0 && (
                <div
                    className="absolute z-50 w-56 bg-background border border-gray-200 dark:border-gray-800 rounded-md shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 flex flex-col shadow-sm"
                    style={{
                        top: slashCoords.top !== undefined ? slashCoords.top : 'auto',
                        bottom: slashCoords.bottom !== undefined ? slashCoords.bottom : 'auto',
                        left: slashCoords.left
                    }}
                >
                    <div className="py-1 max-h-64 overflow-y-auto">
                        <div className="px-3 py-1.5 text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">
                            Ações Básicas
                        </div>
                        {filteredActions.map((action, index) => (
                            <div
                                key={action.id}
                                className={"flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-colors " + (index === slashState.selectedIndex ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground/80")}
                                onClick={() => {
                                    if (editorRef.current?.view) {
                                        const view = editorRef.current.view;
                                        view.dispatch({
                                            changes: {
                                                from: slashState.pos - 1,
                                                to: slashState.pos + slashState.query.length,
                                                insert: ""
                                            },
                                        });
                                        setTimeout(() => handleAction(action.id, { current: { view } } as any), 10);
                                    }
                                }}
                            >
                                <div className={"w-7 h-7 rounded-md flex items-center justify-center border shadow-sm shrink-0 " + (index === slashState.selectedIndex ? "bg-background border-primary/20" : "bg-background")}>
                                    <span className="text-sm font-medium">{action.icon}</span>
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-medium truncate">{action.label}</span>
                                    <span className="text-[10px] opacity-60 truncate">{action.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Selection Floating Menu */}
            <FloatingMenu
                show={menuCoords !== null && slashState?.active !== true}
                top={menuCoords?.top || 0}
                left={menuCoords?.left || 0}
                onAction={(action) => handleAction(action, editorRef)}
            />

            {/* DEBUG STATE */}
            <div className="absolute bottom-4 right-4 z-[9999] p-2 bg-red-900 text-white text-xs font-mono rounded pointer-events-none opacity-80">
                menuCoords: {JSON.stringify(menuCoords)} <br />
                slashActive: {String(slashState?.active)} <br />
                cmState: {debugState ? JSON.stringify(debugState) : 'none'}
            </div>
        </div>
    );
};

export default Editor; // cache invalidation
