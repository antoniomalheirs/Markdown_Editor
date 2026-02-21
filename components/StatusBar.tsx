"use client";

import React from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";

interface StatusBarProps {
    content: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ content }) => {
    const { saveStatus } = useWorkspace();

    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;
    const readingTime = Math.ceil(words / 200);

    return (
        <div className="h-8 border-t border-gray-200 dark:border-gray-800 bg-muted flex items-center justify-between px-4 text-xs text-foreground/60 select-none">
            <div className="flex gap-4">
                <span>{words} palavras</span>
                <span>{chars} caracteres</span>
                <span>{readingTime} min de leitura</span>
            </div>
            <div className="flex gap-2 items-center">
                {saveStatus === "saving" ? (
                    <>
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        <span>Salvando...</span>
                    </>
                ) : saveStatus === "error" ? (
                    <>
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span>Erro ao Salvar</span>
                    </>
                ) : (
                    <>
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Salvo agorinha</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default StatusBar;
