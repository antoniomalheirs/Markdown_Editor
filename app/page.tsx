"use client";

import { useState, useCallback } from "react";
import Editor from "@/components/Editor";
import Preview from "@/components/Preview";
import Toolbar from "@/components/Toolbar";
import StatusBar from "@/components/StatusBar";
import Sidebar from "@/components/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { useEditor } from "@/hooks/use-editor";
import { useScrollSync } from "@/hooks/use-scroll-sync";
import { Copy, Eye, Edit2, Columns, Code, UploadCloud } from "lucide-react";
import {
  Group,
  Panel,
  Separator
} from "react-resizable-panels";

type ViewMode = "write" | "preview" | "split";

export default function Home() {
  const {
    content,
    previewContent,
    handleChange,
    handleAction: handleActionHook,
    handleImageDrop,
    isMounted,
    isDark,
    selection,
    previewSelection,
    setSelection,
    toggleTheme
  } = useEditor();

  const { editorRef, previewRef, handleEditorScroll, handlePreviewScroll } = useScrollSync();
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [isDragActive, setIsDragActive] = useState(false);

  const handleAction = (type: string) => {
    handleActionHook(type, editorRef);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Allow dragleave to correctly register only when leaving the main window, not children
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);

    // Only accept image drops, and reject multiple files drops to prevent errors
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleImageDrop(file, editorRef);
      }
    }
  }, [handleImageDrop, editorRef]);

  if (!isMounted) return null;

  return (
    <div
      className="flex flex-row h-screen w-full bg-background text-foreground transition-colors duration-300 font-sans relative overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Full Screen Dropzone Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none transition-all duration-200">
          <div className="flex flex-col items-center gap-4 p-12 border-2 border-dashed border-primary/50 rounded-2xl bg-muted/50 text-foreground animate-in zoom-in-95 fade-in-0 duration-200">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center bg-primary/10 text-primary">
              <UploadCloud size={32} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-semibold tracking-tight">Soltar Imagem</h3>
              <p className="text-sm text-foreground/60 max-w-xs">Arraste e solte para inserir a imagem diretamente no corpo do editor em Base64.</p>
            </div>
          </div>
        </div>
      )}

      <Sidebar isDark={isDark} />
      <main className="flex-1 flex flex-col min-w-0 h-full relative z-0">
        {/* GitHub-like Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-muted/20 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foreground rounded-md flex items-center justify-center shadow-sm">
              <span className="text-background font-bold text-sm">ZM</span>
            </div>
            <div className="flex flex-col">
              <h1 className="font-semibold text-[15px] tracking-tight leading-tight">ZenMarkdown</h1>
              <span className="text-[11px] text-foreground/50 font-medium">Pro Workspace</span>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
            <button
              onClick={() => setViewMode("write")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "write" ? "bg-background shadow-sm text-foreground" : "text-foreground/60 hover:text-foreground hover:bg-background/50"}`}
            >
              <Edit2 size={14} /> Write
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "preview" ? "bg-background shadow-sm text-foreground" : "text-foreground/60 hover:text-foreground hover:bg-background/50"}`}
            >
              <Eye size={14} /> Preview
            </button>
            <div className="w-px h-4 bg-border mx-1 self-center" />
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "split" ? "bg-background shadow-sm text-foreground" : "text-foreground/60 hover:text-foreground hover:bg-background/50"}`}
            >
              <Columns size={14} /> Split
            </button>
          </div>
        </div>

        {viewMode !== "preview" && (
          <Toolbar onAction={handleAction} isDark={isDark} toggleTheme={toggleTheme} />
        )}
        {viewMode === "preview" && (
          <div className="h-12 border-b border-border flex justify-end items-center px-4 bg-muted/10">
            <button
              onClick={toggleTheme}
              className="p-1.5 hover:bg-muted rounded-md transition-all text-foreground/60 hover:text-foreground text-xs font-medium flex items-center gap-2"
            >
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden relative bg-muted/10">

          {viewMode === "split" ? (
            <div className="max-w-[1920px] w-full mx-auto h-full shadow-sm border-x border-border">
              <Group orientation="horizontal">
                {/* Editor Pane */}
                <Panel defaultSize={50} minSize={20}>
                  <div className="h-full overflow-hidden border-r border-border">
                    <Editor
                      value={content}
                      onChange={handleChange}
                      onScroll={handleEditorScroll}
                      onSelectionChange={setSelection}
                      editorRef={editorRef}
                      isDark={isDark}
                      handleAction={handleActionHook}
                    />
                  </div>
                </Panel>

                {/* Resize Handle (Separator) */}
                <Separator className="w-2 hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors flex items-center justify-center group relative z-50 cursor-col-resize">
                  <div className="w-[1px] h-full bg-border group-hover:bg-blue-400/50" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-8 flex items-center justify-center">
                    <div className="flex gap-px">
                      <div className="w-px h-4 bg-foreground/30 rounded-full" />
                      <div className="w-px h-4 bg-foreground/30 rounded-full" />
                    </div>
                  </div>
                </Separator>

                {/* Preview Pane */}
                <Panel defaultSize={50} minSize={20}>
                  <div className="h-full overflow-hidden bg-background">
                    <Preview
                      content={previewContent}
                      selection={previewSelection}
                      previewRef={previewRef}
                      onScroll={handlePreviewScroll}
                    />
                  </div>
                </Panel>
              </Group>
            </div>
          ) : viewMode === "write" ? (
            <div className="w-full max-w-4xl mx-auto h-full border-x border-border shadow-sm bg-background">
              <Editor
                value={content}
                onChange={handleChange}
                onSelectionChange={setSelection}
                editorRef={editorRef}
                isDark={isDark}
                handleAction={handleActionHook}
              />
            </div>
          ) : (
            <div className="w-full max-w-4xl mx-auto h-full border-x border-border shadow-sm bg-background">
              <Preview
                content={previewContent}
                selection={previewSelection}
                previewRef={previewRef}
              />
            </div>
          )}
        </div>

        <StatusBar content={content} />
      </main>

      <CommandPalette />
    </div>
  );
}
