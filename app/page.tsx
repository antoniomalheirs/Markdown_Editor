"use client";

import { useRef, useCallback } from "react";
import Editor from "@/components/Editor";
import Preview from "@/components/Preview";
import Toolbar from "@/components/Toolbar";
import StatusBar from "@/components/StatusBar";
import { useEditor } from "@/hooks/use-editor";
import { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import {
  Group,
  Panel,
  Separator
} from "react-resizable-panels";

export default function Home() {
  const {
    content,
    handleChange,
    handleAction: handleActionHook,
    handleImageDrop,
    isMounted,
    isDark,
    selection,
    setSelection,
    toggleTheme
  } = useEditor();

  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const isSyncing = useRef(false);

  const handleEditorScroll = useCallback(() => {
    if (isSyncing.current || !editorRef.current?.view || !previewRef.current) return;

    isSyncing.current = true;
    const scroller = editorRef.current.view.scrollDOM;
    const { scrollTop, scrollHeight, clientHeight } = scroller;

    if (scrollHeight > clientHeight) {
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      const previewScroller = previewRef.current;
      previewScroller.scrollTop = scrollPercentage * (previewScroller.scrollHeight - previewScroller.clientHeight);
    }

    // Reset syncing flag after a short delay to allow the triggered scroll event to pass
    setTimeout(() => {
      isSyncing.current = false;
    }, 50);
  }, []);

  const handlePreviewScroll = useCallback(() => {
    if (isSyncing.current || !editorRef.current?.view || !previewRef.current) return;

    isSyncing.current = true;
    const { scrollTop, scrollHeight, clientHeight } = previewRef.current;

    if (scrollHeight > clientHeight) {
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      const editorScroller = editorRef.current.view.scrollDOM;
      editorScroller.scrollTop = scrollPercentage * (editorScroller.scrollHeight - editorScroller.clientHeight);
    }

    setTimeout(() => {
      isSyncing.current = false;
    }, 50);
  }, []);

  const handleAction = (type: string) => {
    handleActionHook(type, editorRef);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageDrop(file, editorRef);
    }
  };

  if (!isMounted) return null;

  return (
    <main
      className="flex flex-col h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-300"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-6 bg-background z-20 shrink-0 shadow-sm relative">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-foreground rounded flex items-center justify-center">
            <span className="text-background font-black text-xs">ZM</span>
          </div>
          <h1 className="font-bold text-lg tracking-tight">ZenMarkdown</h1>
        </div>
        <div className="text-xs text-foreground/40 font-medium">
          v1.5.0 Pro
        </div>
      </div>

      <Toolbar onAction={handleAction} isDark={isDark} toggleTheme={toggleTheme} />

      <div className="flex-1 flex overflow-hidden relative">
        <Group orientation="horizontal">
          {/* Editor Pane */}
          <Panel defaultSize="50%" minSize="20%">
            <div className="h-full overflow-hidden border-r border-border">
              <Editor
                value={content}
                onChange={handleChange}
                onScroll={handleEditorScroll}
                onSelectionChange={setSelection}
                editorRef={editorRef}
              />
            </div>
          </Panel>

          {/* Resize Handle (Separator) */}
          <Separator className="w-1.5 hover:bg-foreground/10 transition-colors flex items-center justify-center group relative z-50">
            <div className="w-[1px] h-full bg-border group-hover:bg-foreground/20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-background border border-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-3 bg-foreground/20 rounded-full" />
                <div className="w-0.5 h-3 bg-foreground/20 rounded-full" />
              </div>
            </div>
          </Separator>

          {/* Preview Pane */}
          <Panel minSize="20%">
            <div className="h-full overflow-hidden bg-background/50">
              <Preview
                content={content}
                selection={selection}
                previewRef={previewRef}
                onScroll={handlePreviewScroll}
              />
            </div>
          </Panel>
        </Group>
      </div>

      <StatusBar content={content} />
    </main>
  );
}
