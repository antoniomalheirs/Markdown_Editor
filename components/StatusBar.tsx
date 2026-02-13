"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StatusBarProps {
    content: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ content }) => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;
    const readingTime = Math.ceil(words / 200);

    return (
        <div className="h-8 border-t border-border bg-muted flex items-center justify-between px-4 text-xs text-foreground/60 select-none">
            <div className="flex gap-4">
                <span>{words} palavras</span>
                <span>{chars} caracteres</span>
                <span>{readingTime} min de leitura</span>
            </div>
            <div className="flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Sincronizado</span>
            </div>
        </div>
    );
};

export default StatusBar;
