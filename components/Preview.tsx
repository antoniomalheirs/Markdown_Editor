"use client";

import React, { useEffect, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import math from "remark-math";
import gemoji from "remark-gemoji";
import frontmatter from "remark-frontmatter";
import katex from "rehype-katex";
import highlight from "rehype-highlight";
import raw from "rehype-raw";
import sanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import GithubSlugger from "github-slugger";
import yaml from "js-yaml";
import { SelectionRange } from "@/hooks/use-editor";
import { VideoPlayer } from "./markdown/VideoPlayer";
import { CodeBlock } from "./markdown/CodeBlock";
import { PrecisionHighlightText, PrecisionWrapper } from "./markdown/PrecisionHighlight";
import MermaidDiagram from "./markdown/MermaidDiagram";

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

const Preview: React.FC<PreviewProps> = ({ content, selection, previewRef, onScroll }) => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    // Extract frontmatter meta data before rendering markdown
    const { markdownContent, metaData, tocData } = useMemo(() => {
        let text = content.replace(/\r\n/g, '\n');
        let meta: Record<string, any> | null = null;
        let toc: Array<{ id: string, text: string, level: number }> = [];

        // Very simple regex extraction for YAML frontmatter at the very start of the file
        const match = text.match(/^---\n([\s\S]*?)\n---\n/);
        if (match) {
            try {
                meta = yaml.load(match[1]) as Record<string, any>;
            } catch (e) {
                console.warn("Invalid YAML frontmatter", e);
            }
        }

        // Extract AST Headers for Table of Contents
        const slugger = new GithubSlugger();
        const lines = text.split('\n');
        let insideCodeBlock = false;

        for (const line of lines) {
            if (line.trim().startsWith('```')) {
                insideCodeBlock = !insideCodeBlock;
                continue;
            }
            if (!insideCodeBlock) {
                const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
                if (headingMatch) {
                    const level = headingMatch[1].length;
                    const headingText = headingMatch[2].trim();
                    toc.push({
                        level,
                        // Strip basic markdown formatting
                        text: headingText.replace(/(\*\*|__|\*|_|~~|`)/g, ''),
                        id: slugger.slug(headingText)
                    });
                }
            }
        }

        return { markdownContent: text, metaData: meta, tocData: toc };
    }, [content]);

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
            if (!childNode.position?.start || !childNode.position?.end) return reactChild;

            if (childNode.type === 'text') {
                const text = childNode.value;
                const startOffset = childNode.position.start.offset;

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
                                                <PrecisionHighlightText text="==" range={{ start: partStart, end: partStart + 2 }} selection={selection} />
                                            </span>
                                            <PrecisionHighlightText text={innerText} range={{ start: partStart + 2, end: partEnd - 2 }} selection={selection} />
                                            <span className="hidden">
                                                <PrecisionHighlightText text="==" range={{ start: partEnd - 2, end: partEnd }} selection={selection} />
                                            </span>
                                        </mark>
                                    );
                                }

                                return <PrecisionHighlightText key={idx} text={part} range={{ start: partStart, end: partEnd }} selection={selection} />;
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
        <div
            id="preview-container"
            ref={previewRef}
            onScroll={onScroll}
            className="h-full w-full overflow-auto bg-background px-4 sm:px-8 py-8 prose prose-slate dark:prose-invert max-w-none selection:bg-blue-300/30 font-sans relative"
            style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"' }}
        >
            {/* Notion-style Page Properties (Frontmatter) */}
            {metaData && Object.keys(metaData).length > 0 && (
                <div className="mb-10 w-full max-w-3xl animate-in fade-in duration-300">
                    {/* Cover Image */}
                    {metaData.cover && (
                        <div className="w-full h-48 sm:h-64 mb-6 rounded-xl overflow-hidden shadow-sm relative group border border-gray-200 dark:border-gray-800">
                            <img src={metaData.cover} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
                        </div>
                    )}

                    {/* Page Icon */}
                    {metaData.icon && (
                        <div className="text-6xl mb-6 relative z-10 ml-2 animate-in zoom-in-95 duration-500 drop-shadow-sm">
                            {metaData.icon}
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5 mt-4">
                        {Object.entries(metaData).map(([key, value]) => {
                            if (key === 'cover' || key === 'icon') return null;
                            if (key === 'title') {
                                return (
                                    <h1 key={key} className="text-4xl font-bold tracking-tight mb-4 text-foreground">
                                        {String(value)}
                                    </h1>
                                );
                            }

                            let valueRender = <span className="text-sm">{String(value)}</span>;

                            // Array of tags
                            if (Array.isArray(value)) {
                                valueRender = (
                                    <div className="flex gap-1.5 flex-wrap">
                                        {value.map((v, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded-md bg-muted text-foreground/80 text-xs font-medium border border-gray-200 dark:border-gray-800/50 shadow-sm">
                                                {String(v)}
                                            </span>
                                        ))}
                                    </div>
                                );
                            }
                            // Status / Checkboxes
                            else if (typeof value === 'boolean') {
                                valueRender = (
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/30 text-xs font-medium w-fit border border-gray-200 dark:border-gray-800">
                                        <div className={`w-2 h-2 rounded-full shadow-sm ${value ? 'bg-green-500' : 'bg-red-500'}`} />
                                        {value ? 'Ativo' : 'Inativo'}
                                    </span>
                                );
                            }
                            // Strings (Status checking)
                            else if (typeof value === 'string') {
                                const lower = value.toLowerCase();
                                if (lower === 'done' || lower === 'completed') {
                                    valueRender = <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-medium border border-green-500/20 shadow-sm">Done</span>;
                                } else if (lower === 'in progress') {
                                    valueRender = <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-medium border border-blue-500/20 shadow-sm">In Progress</span>;
                                } else if (lower === 'todo' || lower === 'to do') {
                                    valueRender = <span className="px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-700 dark:text-slate-400 text-xs font-medium border border-slate-500/20 shadow-sm">To Do</span>;
                                } else if (lower.match(/^\d{4}-\d{2}-\d{2}/)) {
                                    // Make dates Notion-ish
                                    valueRender = <span className="text-sm font-mono text-foreground/80 flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-muted/50 transition-colors w-fit">📅 {value}</span>;
                                } else {
                                    valueRender = <span className="text-[13px] text-foreground/90 font-medium px-2 py-0.5 hover:bg-muted/40 rounded-md transition-colors w-fit">{value}</span>;
                                }
                            }

                            return (
                                <div key={key} className="group flex items-center min-h-[36px] hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors cursor-default">
                                    <div className="w-1/4 min-w-[140px] max-w-[200px] text-[13px] text-foreground/60 font-medium capitalize flex items-center gap-2">
                                        {/* Optional aesthetic marker */}
                                        <div className="w-[3px] h-3 rounded-full bg-border group-hover:bg-primary/50 transition-all opacity-0 group-hover:opacity-100" />
                                        {key}
                                    </div>
                                    <div className="flex-1 flex items-center ml-2">
                                        {valueRender}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <hr className="mt-8 mb-4 border-gray-200 dark:border-gray-800/80" />
                </div>
            )}

            <ReactMarkdown
                remarkPlugins={[gfm, math, gemoji, frontmatter]}
                rehypePlugins={[
                    raw,
                    [sanitize, {
                        ...defaultSchema,
                        tagNames: [...(defaultSchema?.tagNames || []), 'u', 's', 'kbd']
                    }],
                    katex,
                    highlight,
                    rehypeSlug
                ]}
                components={{
                    u: ({ node, children, ...props }) => <u className={`underline decoration-primary/50 underline-offset-4 ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</u>,
                    ul: ({ node, children, ...props }) => <ul className={`list-disc pl-5 mb-4 space-y-1 ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</ul>,
                    ol: ({ node, children, ...props }) => <ol className={`list-decimal pl-5 mb-4 space-y-1 ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</ol>,
                    li: ({ node, children, ...props }) => <li className={`mb-1 leading-relaxed ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</li>,
                    table: ({ node, ...props }) => (
                        <div className={`overflow-x-auto w-full my-6 ${getHighlightClass(node)}`}><table className="min-w-full border-collapse" {...props} /></div>
                    ),
                    th: ({ ...props }) => <th className="border border-gray-200 dark:border-gray-800 p-2 bg-muted/30 font-semibold text-left text-sm" {...props} />,
                    td: ({ ...props }) => <td className="border border-gray-200 dark:border-gray-800 p-2 text-sm leading-relaxed" {...props} />,
                    code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const isBlock = className?.includes("language-") || (typeof children === 'string' && children.trim().includes('\n'));

                        if (!isBlock) {
                            const text = typeof children === 'string' ? children : getTextFromNodes(children);
                            return <code className={`bg-muted/60 px-[0.4em] py-[0.2em] rounded-md text-[85%] font-mono text-foreground/90 whitespace-nowrap m-0 ${getHighlightClass(node)}`} {...props}>{node?.position ? <PrecisionHighlightText text={text} range={{ start: node.position.start.offset, end: node.position.end.offset }} selection={selection} /> : text}</code>;
                        }

                        const language = match ? match[1] : "";
                        const text = typeof children === 'string' ? children : getTextFromNodes(children);

                        if (language === 'mermaid') {
                            return <MermaidDiagram chart={text.trim()} />;
                        }

                        return <CodeBlock language={language} isHighlighted={checkHighlight(node)}>{children}</CodeBlock>;
                    },
                    pre: ({ children }) => <>{children}</>,
                    h1: ({ node, children, ...props }) => (
                        <h1 className={`text-[2em] font-semibold mb-4 mt-6 border-b border-gray-200 dark:border-gray-800 pb-2 tracking-tight ${getHighlightClass(node)}`} {...props}>
                            {renderPrecision(node, children)}
                        </h1>
                    ),
                    h2: ({ node, children, ...props }) => (
                        <h2 className={`text-[1.5em] font-semibold mb-4 mt-6 border-b border-gray-200 dark:border-gray-800 pb-2 tracking-tight ${getHighlightClass(node)}`} {...props}>
                            {renderPrecision(node, children)}
                        </h2>
                    ),
                    h3: ({ node, children, ...props }) => <h3 className={`text-[1.25em] font-semibold mb-3 mt-6 tracking-tight ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</h3>,
                    h4: ({ node, children, ...props }) => <h4 className={`text-[1em] font-semibold mb-3 mt-6 tracking-tight ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</h4>,
                    details: ({ node, children, ...props }: any) => (
                        <details className={`group border border-gray-200 dark:border-gray-800/60 bg-muted/5 rounded-lg my-4 overflow-hidden shadow-sm transition-all ${getHighlightClass(node)}`} {...props}>
                            {renderPrecision(node, children)}
                        </details>
                    ),
                    summary: ({ node, children, ...props }: any) => (
                        <summary className="font-medium text-[15px] text-foreground/90 select-none flex items-center p-3 cursor-pointer outline-none bg-muted/20 hover:bg-muted/40 transition-colors" {...props}>
                            <div className="text-muted-foreground/70 transition-transform duration-200 group-open:rotate-90 mr-3 flex-shrink-0 text-xs">▶</div>
                            {renderPrecision(node, children)}
                        </summary>
                    ),
                    blockquote: ({ node, children, ...props }) => {
                        const pChild = node?.children?.find((c: any) => c.type === 'element' && c.tagName === 'p') as any;
                        let type = "";

                        if (pChild && pChild.children?.length > 0 && pChild.children[0].type === 'text') {
                            const text = pChild.children[0].value;
                            const match = text?.match(/^\s*\[!(note|info|warning|tip|caution|danger|important|toc)\]/i);
                            if (match) type = match[1].toLowerCase();
                        }

                        if (type) {
                            if (type === 'toc') {
                                return (
                                    <div className={`my-6 rounded-xl border border-gray-200 dark:border-gray-800/50 bg-muted/10 p-5 shadow-sm ${getHighlightClass(node)}`}>
                                        <div className="flex items-center gap-2 mb-4 text-foreground/80 font-bold text-[13px] uppercase tracking-wider">
                                            <span className="text-lg">📑</span> Table of Contents
                                        </div>
                                        <ul className="space-y-1.5 text-[14px]">
                                            {tocData.length === 0 ? (
                                                <li className="text-foreground/50 italic text-sm">No headers found.</li>
                                            ) : (
                                                tocData.map((item, i) => (
                                                    <li key={i} style={{ paddingLeft: `${(item.level - 1) * 1.25}rem` }}>
                                                        <a
                                                            href={`#${item.id}`}
                                                            className="text-foreground/80 hover:text-primary transition-all flex items-center gap-2 hover:translate-x-1 duration-200"
                                                        >
                                                            <div className="w-1 h-1 rounded-full bg-border flex-shrink-0" />
                                                            <span className="truncate">{item.text}</span>
                                                        </a>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </div>
                                );
                            }

                            const icons: Record<string, string> = { note: "📔", info: "💡", tip: "✨", warning: "⚠️", caution: "🚧", danger: "🚨", important: "📌" };
                            const bgColors: Record<string, string> = {
                                note: "bg-slate-500/5",
                                info: "bg-blue-500/5",
                                tip: "bg-green-500/5",
                                warning: "bg-yellow-500/5",
                                caution: "bg-orange-500/5",
                                danger: "bg-red-500/5",
                                important: "bg-purple-500/5"
                            };
                            const borderColors: Record<string, string> = {
                                note: "border-slate-500/20",
                                info: "border-blue-500/20",
                                tip: "border-green-500/20",
                                warning: "border-yellow-500/20",
                                caution: "border-orange-500/20",
                                danger: "border-red-500/20",
                                important: "border-purple-500/20"
                            };

                            return (
                                <div className={`flex gap-3 p-4 my-4 rounded-xl border ${bgColors[type]} ${borderColors[type]} ${getHighlightClass(node)}`}>
                                    <div className="text-xl flex-shrink-0 mt-0.5 select-none">{icons[type] || "💡"}</div>
                                    <div
                                        className="flex-1 max-w-full overflow-hidden text-[14px] leading-relaxed [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 text-foreground/90"
                                        ref={el => {
                                            if (el) {
                                                const fp = el.querySelector('p');
                                                if (fp && fp.innerHTML.match(/^\s*\[!(note|info|warning|tip|caution|danger|important|toc)\]/i)) {
                                                    fp.innerHTML = fp.innerHTML.replace(/^\s*\[!.*?\]\s*(<br>)?/i, '');
                                                }
                                            }
                                        }}
                                    >
                                        {renderPrecision(node, children)}
                                    </div>
                                </div>
                            );
                        }
                        return <blockquote className={`border-l-4 border-muted-foreground/30 bg-muted/10 py-2 pr-4 pl-4 text-foreground/80 my-4 rounded-r-lg italic ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</blockquote>;
                    },
                    a: ({ children, href, node, ...props }) => {
                        const url = href || "";
                        if (isVideoUrl(url)) return <VideoPlayer src={url} />;
                        if (isImageUrl(url)) return <div className={`my-4 flex justify-center ${getHighlightClass(node)}`}><PrecisionWrapper node={node} selection={selection}><img src={url} className="max-w-[100%] border border-gray-200 dark:border-gray-800" alt="Auto-embedded" /></PrecisionWrapper></div>;
                        return <a href={href} target="_blank" rel="noopener noreferrer" className={`text-[#0969da] dark:text-[#58a6ff] hover:underline transition-none ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</a>;
                    },
                    p: ({ children, node, ...props }) => {
                        if (node && node.children?.length === 1 && node.children[0].type === 'text' && isVideoUrl(node.children[0].value.trim())) return <VideoPlayer src={node.children[0].value.trim()} />;
                        return <p className={`leading-snug mb-4 ${getHighlightClass(node)}`} {...props}>{renderPrecision(node, children)}</p>;
                    },
                    img: ({ node, ...props }) => <PrecisionWrapper node={node} selection={selection}><img className={`inline-block max-w-[100%] border border-gray-200 dark:border-gray-800 ${getHighlightClass(node)}`} {...props} alt={props.alt || "image"} /></PrecisionWrapper>,
                    mark: ({ ...props }) => <mark className="bg-yellow-200 text-inherit px-1 rounded-sm" {...props} />,
                    hr: ({ node, ...props }) => <hr className={`h-[0.25em] p-0 my-6 bg-border border-0 ${getHighlightClass(node)}`} {...props} />
                }}
            >
                {markdownContent}
            </ReactMarkdown>
        </div>
    );
};

export default React.memo(Preview);

