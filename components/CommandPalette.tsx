"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import { Search, FileText, X } from 'lucide-react';

export const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { notes, setActiveNote, activeNoteId } = useWorkspace();
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(query.toLowerCase()));

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'k')) {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleSelect = (id: string) => {
        setActiveNote(id);
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <div
                className="relative w-full max-w-xl bg-background rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setSelectedIndex(prev => (prev + 1) % filteredNotes.length);
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSelectedIndex(prev => (prev - 1 + filteredNotes.length) % filteredNotes.length);
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredNotes[selectedIndex]) {
                            handleSelect(filteredNotes[selectedIndex].id);
                        }
                    }
                }}
            >
                <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
                    <Search className="w-5 h-5 text-muted-foreground mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 h-14 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-lg"
                        placeholder="Search files or jump to..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-md text-muted-foreground hover:bg-muted/50 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {filteredNotes.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            No files found.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            <div className="px-3 pb-2 pt-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Files
                            </div>
                            {filteredNotes.map((note, idx) => (
                                <button
                                    key={note.id}
                                    className={`flex justify-between items-center w-full px-3 py-3 rounded-lg text-left text-sm transition-colors ${idx === selectedIndex
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-foreground/80 hover:bg-muted/50 hover:text-foreground'
                                        }`}
                                    onClick={() => handleSelect(note.id)}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <FileText size={16} className={idx === selectedIndex ? "text-primary/80" : "text-muted-foreground"} />
                                        <span className="truncate font-medium">{note.title}</span>
                                    </div>
                                    {note.id === activeNoteId && (
                                        <span className="text-[10px] font-medium uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-md flex-shrink-0">
                                            Active
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-muted/40 border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><kbd className="bg-background border border-gray-200 dark:border-gray-800 rounded px-1.5 py-0.5 font-sans shadow-sm">↑</kbd><kbd className="bg-background border border-gray-200 dark:border-gray-800 rounded px-1.5 py-0.5 font-sans shadow-sm">↓</kbd> to navigate</span>
                        <span className="flex items-center gap-1.5"><kbd className="bg-background border border-gray-200 dark:border-gray-800 rounded px-1.5 py-0.5 font-sans shadow-sm">↵</kbd> to open</span>
                        <span className="flex items-center gap-1.5"><kbd className="bg-background border border-gray-200 dark:border-gray-800 rounded px-1.5 py-0.5 font-sans shadow-sm">esc</kbd> to close</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
