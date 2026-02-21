"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

const getTextFromNodes = (node: any): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return node.toString();
    if (Array.isArray(node)) return node.map(getTextFromNodes).join("");
    if (node?.props?.children) return getTextFromNodes(node.props.children);
    return "";
};

export const CodeBlock = ({ language, children, isHighlighted }: { language: string, children: React.ReactNode, isHighlighted?: boolean }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const rawText = getTextFromNodes(children);
        navigator.clipboard.writeText(rawText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`relative group my-6 overflow-hidden border transition-all duration-300 ${isHighlighted ? 'bg-yellow-400/5 border-yellow-400/30 scale-[1.01] shadow-[0_0_20px_-5px_rgba(250,204,21,0.15)]' : 'bg-muted/30 border-gray-200 dark:border-gray-800 rounded-md'}`}>
            <div className={`flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 ${isHighlighted ? 'bg-yellow-400/10' : 'bg-muted/50'}`}>
                <span className="text-xs font-mono text-foreground/60">
                    {language || 'text'}
                </span>
                <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-foreground/10 text-foreground/50 hover:text-foreground/80 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5">
                    {copied ? <><Check size={14} className="text-green-500" /><span className="text-xs text-green-500 font-medium">Copied!</span></> : <><Copy size={14} /><span className="text-xs font-medium">Copy</span></>}
                </button>
            </div>
            <pre className="!p-4 m-0 overflow-x-auto no-scrollbar !bg-transparent">
                <code className={`language-${language} text-sm font-mono leading-snug block text-foreground/90`}>{children}</code>
            </pre>
        </div>
    );
};
