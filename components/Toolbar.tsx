"use client";

import React from "react";
import {
    Bold, Italic, Link, Image as ImageIcon, Table, Heading1, Heading2, Heading3,
    List, ListOrdered, CheckSquare, Code, Quote,
    FileUp, FileDown, Moon, Sun, Type, Minus, Strikethrough,
    Underline, Highlighter
} from "lucide-react";

interface ToolbarProps {
    onAction: (type: string) => void;
    isDark: boolean;
    toggleTheme: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAction, isDark, toggleTheme }) => {
    const tools = [
        { icon: Heading1, label: "H1", action: "h1" },
        { icon: Heading2, label: "H2", action: "h2" },
        { icon: Heading3, label: "H3", action: "h3" },
        { type: "separator" },
        { icon: Bold, label: "Bold", action: "bold" },
        { icon: Italic, label: "Italic", action: "italic" },
        { icon: Underline, label: "Underline", action: "underline" },
        { icon: Strikethrough, label: "Strikethrough", action: "strikethrough" },
        { icon: Highlighter, label: "Highlight", action: "highlight" },
        { type: "separator" },
        { icon: Type, label: "Inline Code", action: "inline-code" },
        { icon: Code, label: "Code Block", action: "code" },
        { icon: Quote, label: "Quote", action: "quote" },
        { icon: Link, label: "Link", action: "link" },
        { icon: ImageIcon, label: "Image", action: "image" },
        { type: "separator" },
        { icon: List, label: "List", action: "ul" },
        { icon: ListOrdered, label: "Ordered List", action: "ol" },
        { icon: CheckSquare, label: "Task List", action: "task" },
        { icon: Minus, label: "Horizontal Line", action: "hr" },
        { icon: Table, label: "Table", action: "table" },
    ];

    return (
        <div className="h-10 border-b border-gray-200 dark:border-gray-800 bg-muted/5 flex items-center justify-between px-2 overflow-x-auto no-scrollbar shrink-0">
            <div className="flex items-center gap-0.5 whitespace-nowrap">
                {tools.map((tool, idx) => {
                    if (tool.type === "separator") {
                        return <div key={`sep-${idx}`} className="w-[1px] h-4 bg-border mx-1.5" />;
                    }
                    const Icon = tool.icon!;
                    return (
                        <button
                            key={tool.action}
                            onClick={() => onAction(tool.action!)}
                            className="p-1.5 hover:bg-muted/50 rounded transition-colors text-foreground/60 hover:text-foreground active:scale-95 flex items-center justify-center w-7 h-7"
                            title={tool.label}
                        >
                            <Icon size={14} strokeWidth={2.5} />
                        </button>
                    );
                })}
                <div className="w-[1px] h-4 bg-border mx-1.5" />
                <button onClick={() => onAction("import")} className="flex items-center gap-1.5 p-1.5 hover:bg-muted/50 rounded transition-colors text-foreground/60 hover:text-foreground h-7 px-2 text-xs font-semibold" title="Import (.md)">
                    <FileUp size={14} /> Import
                </button>
                <button onClick={() => onAction("export-md")} className="flex items-center gap-1.5 p-1.5 hover:bg-muted/50 rounded transition-colors text-foreground/60 hover:text-foreground h-7 px-2 text-xs font-semibold" title="Export MD">
                    <FileDown size={14} /> Export
                </button>
                <div className="w-[1px] h-4 bg-border mx-1.5" />
                <button onClick={() => onAction("export-pdf")} className="flex items-center gap-1.5 p-1.5 hover:bg-red-500/10 rounded transition-colors text-red-500/70 hover:text-red-500 h-7 px-2 text-xs font-semibold" title="Export PDF">
                    <FileDown size={14} /> PDF
                </button>
            </div>

            <div className="flex items-center gap-2 ml-4">
                <button
                    onClick={toggleTheme}
                    className="p-1.5 hover:bg-muted/50 rounded transition-colors text-foreground/60 hover:text-foreground flex items-center justify-center w-7 h-7"
                    title={isDark ? "Light Mode" : "Dark Mode"}
                >
                    {isDark ? <Sun size={14} /> : <Moon size={14} />}
                </button>
            </div>
        </div>
    );
};

export default Toolbar;
