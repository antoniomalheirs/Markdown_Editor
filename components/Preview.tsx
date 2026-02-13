"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import math from "remark-math";
import gemoji from "remark-gemoji";
import katex from "rehype-katex";
import highlight from "rehype-highlight";
import raw from "rehype-raw";
import sanitize from "rehype-sanitize";
import { Copy, Check, Play, Pause } from "lucide-react";
import { SelectionRange } from "@/hooks/use-editor";

interface PreviewProps {
    content: string;
    selection: SelectionRange | null;
    previewRef: React.RefObject<HTMLDivElement | null>;
    onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

const getTextFromNodes = (node: any): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return node.toString();
    if (Array.isArray(node)) return node.map(getTextFromNodes).join("");
    if (node?.props?.children) return getTextFromNodes(node.props.children);
    return "";
};

const VideoPlayer = ({ src }: { src: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true);

    const togglePlay = () => {
        if (videoRef.current) {
            videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
        }
    };

    return (
        <div className="my-8 rounded-xl overflow-hidden shadow-2xl border border-border bg-black/5 aspect-video relative group">
            <video
                ref={videoRef}
                src={src}
                controls
                className="w-full h-full object-contain"
                onPlay={() => {
                    setIsPlaying(true);
                    setTimeout(() => setShowOverlay(false), 2000);
                }}
                onPause={() => {
                    setIsPlaying(false);
                    setShowOverlay(true);
                }}
            />
            <div
                onClick={togglePlay}
                className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-all duration-300 ${showOverlay || !isPlaying ? 'bg-black/20 opacity-100' : 'bg-transparent opacity-0 group-hover:opacity-100'
                    }`}
            >
                <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                    {isPlaying ? <Pause size={42} className="text-white fill-white shadow-xl" /> : <Play size={42} className="text-white fill-white ml-1 shadow-xl" />}
                </div>
            </div>
        </div>
    );
};

const CodeBlock = ({ language, children, isHighlighted }: { language: string, children: React.ReactNode, isHighlighted?: boolean }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const rawText = getTextFromNodes(children);
        navigator.clipboard.writeText(rawText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`relative group my-6 rounded-lg overflow-hidden shadow-sm border transition-all duration-300 ${isHighlighted ? 'bg-yellow-400/5 border-yellow-400/30 scale-[1.01] shadow-[0_0_20px_-5px_rgba(250,204,21,0.15)]' : 'bg-[var(--code-bg)] border-border'}`}>
            <div className={`flex items-center justify-between px-3 py-1.5 border-b border-border ${isHighlighted ? 'bg-yellow-400/10' : 'bg-[var(--code-header)]'}`}>
                <span className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest font-semibold flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                    <span className="ml-1 opacity-70">{language || 'code'}</span>
                </span>
                <button onClick={handleCopy} className="p-1 rounded-md hover:bg-foreground/5 text-foreground/30 hover:text-foreground/60 transition-all opacity-0 group-hover:opacity-100">
                    {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                </button>
            </div>
            <pre className="!p-4 m-0 overflow-x-auto no-scrollbar !bg-transparent">
                <code className={`language-${language} text-sm font-mono leading-snug block text-[var(--code-text)]`}>{children}</code>
            </pre>
        </div>
    );
};

const PrecisionHighlightText = ({ text, range, selection }: { text: string, range: { start: number, end: number }, selection: SelectionRange | null }) => {
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

const PrecisionWrapper = ({ children, node, selection }: { children: React.ReactNode, node: any, selection: SelectionRange | null }) => {
    if (!selection || !node?.position) return <>{children}</>;
    const { start, end } = node.position;
    const isSelected = selection.fromOffset < end.offset && selection.toOffset > start.offset;
    if (!isSelected) return <>{children}</>;
    return <span className="relative inline-block rounded-md ring-4 ring-[#fbbf24]/60 shadow-[0_0_20px_rgba(251,191,36,0.5)] animate-pulse transition-all duration-300 z-10">{children}</span>;
};

const Preview: React.FC<PreviewProps> = ({ content, selection, previewRef, onScroll }) => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);
    const processedContent = useMemo(() => content.replace(/\r\n/g, '\n'), [content]);
    if (!isMounted) return null;

    const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov)$/i.test(url) || url.includes('/assets/') || url.includes('user-images.githubusercontent.com');
    const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|svg|webp|avif)$/i.test(url);

    const checkHighlight = (node: any) => {
        if (!selection || !node?.position) return false;
        return selection.fromLine <= node.position.end.line && selection.toLine >= node.position.start.line;
    };

    const getHighlightClass = (node: any) => checkHighlight(node) ? "bg-yellow-400/[0.04] rounded transition-all duration-300 relative" : "transition-all duration-300 relative";

    const renderPrecision = (node: any, children: React.ReactNode) => {
        if (!node?.children) return children;
        const childrenArray = React.Children.toArray(children);
        return node.children.map((childNode: any, i: number) => {
            const reactChild = childrenArray[i];
            if (!childNode.position?.start || !childNode.position?.end) return reactChild; // Safety check

            if (childNode.type === 'text') {
                const text = childNode.value;
                const startOffset = childNode.position.start.offset;

                // Handle highlight syntax ==text==
                if (text.includes('==')) {
                    const parts = text.split(/(==[^=]+==)/g);
                    let currentOffset = 0;

                    return (
                        <React.Fragment key={i}>
                            {parts.map((part: string, idx: number) => {
                                const partLen = part.length;
                                const partStart = startOffset + currentOffset;
                                const partEnd = partStart + partLen;
                                currentOffset += partLen;

                                if (!part) return null;

                                const isHighlight = part.startsWith('==') && part.endsWith('==') && part.length >= 4;

                                if (isHighlight) {
                                    const innerText = part.slice(2, -2);
                                    return (
                                        <mark key={idx} className="bg-yellow-200 dark:bg-yellow-500/30 text-inherit px-1 rounded mx-0.5">
                                            <span className="hidden">
                                                <PrecisionHighlightText
                                                    text="=="
                                                    range={{ start: partStart, end: partStart + 2 }}
                                                    selection={selection}
                                                />
                                            </span>
                                            <PrecisionHighlightText
                                                text={innerText}
                                                range={{ start: partStart + 2, end: partEnd - 2 }}
                                                selection={selection}
                                            />
                                            <span className="hidden">
                                                <PrecisionHighlightText
                                                    text="=="
                                                    range={{ start: partEnd - 2, end: partEnd }}
                                                    selection={selection}
                                                />
                                            </span>
                                        </mark>
                                    );
                                }

                                return (
                                    <PrecisionHighlightText
                                        key={idx}
                                        text={part}
                                        range={{ start: partStart, end: partEnd }}
                                        selection={selection}
                                    />
                                );
                            })}
                        </React.Fragment>
                    );
                }

                return <PrecisionHighlightText key={i} text={childNode.value} range={{ start: childNode.position.start.offset, end: childNode.position.end.offset }} selection={selection} />;
            }
            return <PrecisionWrapper key={i} node={childNode} selection={selection}>{reactChild}</PrecisionWrapper>;
        });
    };

    return (
        <div id="preview-container" ref={previewRef} onScroll={onScroll} className="h-full w-full overflow-auto bg-background px-8 py-10 prose prose-slate dark:prose-invert max-w-none selection:bg-yellow-400/20">
            <ReactMarkdown
                remarkPlugins={[gfm, math, gemoji]}
                rehypePlugins={[raw, sanitize, katex, highlight]}
                components={{
                    ul: ({ node, children, ...props }) => <ul className={`list-disc ml-6 mb-4 space-y-1 ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</ul>,
                    ol: ({ node, children, ...props }) => <ol className={`list-decimal ml-6 mb-4 space-y-1 ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</ol>,
                    li: ({ node, children, ...props }) => <li className={`mb-1 leading-relaxed ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</li>,
                    table: ({ node, ...props }) => (
                        <div className={`overflow-x-auto w-full my-6 border border-border rounded-lg shadow-sm bg-muted/20 ${getHighlightClass(node)}`}><table className="min-w-full border-collapse" {...props} /></div>
                    ),
                    th: ({ ...props }) => <th className="border-b border-border p-3 bg-muted/50 font-bold text-left text-xs uppercase tracking-wider" {...props} />,
                    td: ({ ...props }) => <td className="border-b border-border p-3 text-sm leading-relaxed" {...props} />,
                    code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const isBlock = className?.includes("language-") || (typeof children === 'string' && children.trim().includes('\n'));
                        if (!isBlock) {
                            const text = typeof children === 'string' ? children : getTextFromNodes(children);
                            return <code className={`bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border text-foreground/90 whitespace-nowrap ${getHighlightClass(node)}`} {...props}>{node?.position ? <PrecisionHighlightText text={text} range={{ start: node.position.start.offset, end: node.position.end.offset }} selection={selection} /> : text}</code>;
                        }
                        return <CodeBlock language={match ? match[1] : ""} isHighlighted={checkHighlight(node)}>{children}</CodeBlock>;
                    },
                    pre: ({ children }) => <>{children}</>,
                    h1: ({ node, children, ...props }) => <h1 className={`text-3xl font-extrabold mb-6 mt-10 border-b border-border pb-3 tracking-tight px-2 -mx-2 ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</h1>,
                    h2: ({ node, children, ...props }) => <h2 className={`text-xl font-bold mb-4 mt-8 tracking-tight text-foreground/90 px-2 -mx-2 ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</h2>,
                    h3: ({ node, children, ...props }) => <h3 className={`text-lg font-semibold mb-3 mt-6 tracking-tight text-foreground/80 px-2 -mx-2 ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</h3>,
                    blockquote: ({ node, children, ...props }) => <blockquote className={`border-l-[4px] border-muted bg-muted/5 py-1 pl-5 italic text-foreground/60 my-6 rounded-r-md ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</blockquote>,
                    a: ({ children, href, node, ...props }) => {
                        const url = href || "";
                        if (isVideoUrl(url)) return <VideoPlayer src={url} />;
                        if (isImageUrl(url)) return <div className={`my-8 flex justify-center ${getHighlightClass(node)}`}><PrecisionWrapper node={node} selection={selection}><img src={url} className="rounded-xl shadow-lg max-w-[100%] border border-border" alt="Auto-embedded" /></PrecisionWrapper></div>;
                        return <a href={href} target="_blank" rel="noopener noreferrer" className={`text-foreground font-semibold underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-all ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</a>;
                    },
                    p: ({ children, node, ...props }) => {
                        if (node && node.children?.length === 1 && node.children[0].type === 'text' && isVideoUrl(node.children[0].value.trim())) return <VideoPlayer src={node.children[0].value.trim()} />;
                        return <p className={`leading-7 mb-4 text-foreground/80 px-2 -mx-2 ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</p>;
                    },
                    img: ({ node, ...props }) => <PrecisionWrapper node={node} selection={selection}><img className={`inline-block rounded shadow-sm max-w-[100%] border border-border ${getHighlightClass(node)}`} {...props} alt={props.alt || "image"} /></PrecisionWrapper>,
                    mark: ({ ...props }) => <mark className="bg-yellow-200 dark:bg-yellow-900/40 text-inherit px-1 rounded" {...props} />
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};

export default Preview;
