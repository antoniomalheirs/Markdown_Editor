"use client";

import React from "react";
import { SelectionRange } from "@/hooks/use-editor";

export const PrecisionHighlightText = ({ text, range, selection }: { text: string, range: { start: number, end: number }, selection: SelectionRange | null }) => {
    if (!selection || selection.fromOffset >= range.end || selection.toOffset <= range.start) return <>{text}</>;

    const startOffset = Math.max(0, selection.fromOffset - range.start);
    const endOffset = Math.min(text.length, selection.toOffset - range.start);
    const before = text.slice(0, startOffset);
    const highlighted = text.slice(startOffset, endOffset);
    const after = text.slice(endOffset);

    if (selection.fromOffset === selection.toOffset) {
        return (
            <>{before}<span className="inline-block w-[2px] h-[1.1em] -mb-[0.1em] bg-[#fbbf24] shadow-[0_0_8px_#fbbf24] animate-pulse rounded-full" />{highlighted}{after}</>
        );
    }

    return (
        <>
            {before}
            <span className="bg-[#fbbf24] text-black font-bold rounded shadow-[0_1px_15px_rgba(251,191,36,0.6)] ring-2 ring-[#f59e0b] px-0.5 transition-all duration-150 relative z-10">
                {highlighted}
            </span>
            {after}
        </>
    );
};

export const PrecisionWrapper = ({ children, node, selection }: { children: React.ReactNode, node: any, selection: SelectionRange | null }) => {
    if (!selection || !node?.position) return <>{children}</>;
    const { start, end } = node.position;
    const isSelected = selection.fromOffset < end.offset && selection.toOffset > start.offset;
    if (!isSelected) return <>{children}</>;
    return <span className="relative inline-block rounded-md ring-4 ring-[#fbbf24]/60 shadow-[0_0_20px_rgba(251,191,36,0.5)] animate-pulse transition-all duration-300 z-10">{children}</span>;
};
