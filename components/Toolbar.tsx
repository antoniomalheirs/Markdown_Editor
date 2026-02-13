"use client";

import React from "react";
import {
    Bold, Italic, Link, Image, Table, Heading1, Heading2, Heading3,
    List, ListOrdered, CheckSquare, Code, Quote, Save,
    FileUp, FileDown, Moon, Sun, Type, Minus, Strikethrough,
    Underline, Highlighter, Eye, EyeOff
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
        { icon: Bold, label: "Negrito", action: "bold" },
        { icon: Italic, label: "Itálico", action: "italic" },
        { icon: Underline, label: "Sublinhado", action: "underline" },
        { icon: Strikethrough, label: "Riscado", action: "strikethrough" },
        { icon: Highlighter, label: "Destaque", action: "highlight" },
        { icon: Type, label: "Código Inline", action: "inline-code" },
        { icon: Code, label: "Bloco de Código", action: "code" },
        { icon: Quote, label: "Citação", action: "quote" },
        { icon: Link, label: "Link", action: "link" },
        { icon: Image, label: "Imagem", action: "image" },
        { icon: List, label: "Lista", action: "ul" },
        { icon: ListOrdered, label: "Lista Ordenada", action: "ol" },
        { icon: CheckSquare, label: "Checklist", action: "task" },
        { icon: Minus, label: "Linha Horizontal", action: "hr" },
        { icon: Table, label: "Tabela", action: "table" },
    ];

    return (
        <div className="h-12 border-b border-border bg-muted/30 flex items-center justify-between px-4 overflow-x-auto no-scrollbar shrink-0 shadow-sm">
            <div className="flex items-center gap-0.5">
                {tools.map((tool) => (
                    <button
                        key={tool.action}
                        onClick={() => onAction(tool.action)}
                        className="p-2 hover:bg-background rounded-md transition-all text-foreground/60 hover:text-foreground hover:shadow-sm"
                        title={tool.label}
                    >
                        <tool.icon size={18} />
                    </button>
                ))}
                <div className="w-px h-6 bg-border mx-2" />
                <button onClick={() => onAction("import")} className="p-2 hover:bg-background rounded-md transition-all text-foreground/60 hover:text-foreground" title="Importar (.md)">
                    <FileUp size={18} />
                </button>
                <button onClick={() => onAction("export-md")} className="p-2 hover:bg-background rounded-md transition-all text-foreground/60 hover:text-foreground" title="Exportar MD">
                    <FileDown size={18} />
                </button>
                <button onClick={() => onAction("export-pdf")} className="p-2 hover:bg-background rounded-md transition-all text-red-400 hover:text-red-500" title="Exportar PDF">
                    <FileDown size={18} />
                </button>
            </div>

            <div className="flex items-center gap-2 ml-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 hover:bg-background rounded-md transition-all text-foreground/60 hover:text-foreground"
                    title={isDark ? "Modo Claro" : "Modo Escuro"}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>
        </div>
    );
};

export default Toolbar;
