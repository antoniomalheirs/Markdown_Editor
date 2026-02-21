"use client";

import { useRef, useCallback } from "react";
import { ReactCodeMirrorRef } from "@uiw/react-codemirror";

export function useScrollSync() {
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

    return {
        editorRef,
        previewRef,
        handleEditorScroll,
        handlePreviewScroll
    };
}
