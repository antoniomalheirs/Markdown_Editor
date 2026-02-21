import React, { useMemo, useState, useEffect } from 'react';
import { useWorkspace, Note } from '@/hooks/use-workspace';
import { FileText, Plus, Trash2, ChevronLeft, ChevronRight, Check, X, Pencil } from 'lucide-react';

const Sidebar = ({ isDark }: { isDark: boolean }) => {
    const { notes, activeNoteId, isSidebarOpen, createNote, setActiveNote, deleteNote, renameNote, toggleSidebar } = useWorkspace();
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");

    // Auto-cancel confirmation after 3 seconds of inactivity
    useEffect(() => {
        if (!noteToDelete) return;
        const timer = setTimeout(() => setNoteToDelete(null), 3000);
        return () => clearTimeout(timer);
    }, [noteToDelete]);

    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    }, [notes]);

    const formatDate = (timestamp: number) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        }).format(new Date(timestamp));
    };

    if (!isSidebarOpen) {
        return (
            <div className={`h-full border-r ${isDark ? 'border-gray-800 bg-muted/20 text-[#c9d1d9]' : 'border-gray-200 bg-slate-50 text-slate-900'} w-12 flex flex-col items-center py-4 shrink-0 transition-all`}>
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 hover:bg-muted rounded-md opacity-60 hover:opacity-100 transition-all"
                    title="Abrir Sidebar"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        );
    }

    return (
        <div className={`
            ${isSidebarOpen ? 'w-64 border-r' : 'w-0 border-r-0'} 
            h-full ${isDark ? 'bg-[#0d1117] border-gray-800/40 text-[#c9d1d9]' : 'bg-slate-50 border-gray-200 text-slate-900'} shrink-0 flex flex-col 
            transition-all duration-300 ease-in-out relative origin-left z-20 group/sidebar
        `}>
            {/* Header / New Note */}
            <div className={`p-3 border-b ${isDark ? 'border-gray-800/40' : 'border-gray-200'} shrink-0 flex items-center justify-between`}>
                {isSidebarOpen && (
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-primary font-bold text-xs tracking-tighter">ZM</span>
                        </div>
                        <div className="flex flex-col truncate flex-1 leading-none mr-2">
                            <span className="font-semibold text-[13px] opacity-90 truncate">ZenMarkdown</span>
                            <span className="text-[10px] opacity-70 truncate">Pro Workspace</span>
                        </div>
                    </div>
                )}
                <button
                    onClick={createNote}
                    className="p-1.5 hover:bg-muted opacity-70 hover:opacity-100 rounded transition-colors shrink-0"
                    title="Nova Nota"
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Note List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-0.5 custom-scrollbar">
                {sortedNotes.map(note => (
                    <div
                        key={note.id}
                        className={`group/item w-full flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${activeNoteId === note.id
                            ? 'bg-primary/10 text-primary font-medium shadow-sm ring-1 ring-primary/20'
                            : 'hover:bg-muted/50 opacity-80 hover:opacity-100'
                            }`}
                        onClick={() => {
                            setActiveNote(note.id);
                            if (noteToDelete && noteToDelete !== note.id) setNoteToDelete(null);
                        }}
                        onMouseLeave={() => {
                            if (noteToDelete === note.id) setNoteToDelete(null);
                        }}
                    >
                        <div className="flex items-center gap-2.5 overflow-hidden w-full">
                            <FileText size={14} className={`shrink-0 ${activeNoteId === note.id ? 'text-primary' : 'opacity-60'}`} />
                            {editingNoteId === note.id ? (
                                <input
                                    type="text"
                                    autoFocus
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            renameNote(note.id, editingTitle);
                                            setEditingNoteId(null);
                                        } else if (e.key === 'Escape') {
                                            setEditingNoteId(null);
                                        }
                                    }}
                                    onBlur={() => {
                                        renameNote(note.id, editingTitle);
                                        setEditingNoteId(null);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[13px] bg-transparent border border-primary/50 rounded-sm outline-none w-full opacity-90 font-medium px-1 py-0.5"
                                />
                            ) : (
                                <div className="flex flex-col overflow-hidden justify-center min-h-[28px]">
                                    <span className="text-[13px] truncate leading-tight">{note.title}</span>
                                    <span className="text-[10px] opacity-50 truncate mt-0.5 font-mono">{formatDate(note.updatedAt)}</span>
                                </div>
                            )}
                        </div>
                        {noteToDelete === note.id ? (
                            <div className="flex items-center gap-0.5 shrink-0 bg-red-500/10 rounded-md p-0.5 animate-in fade-in zoom-in-95 duration-150 relative z-10 border border-red-500/20">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNote(note.id);
                                        setNoteToDelete(null);
                                    }}
                                    className="p-1 hover:bg-red-500/20 hover:text-red-500 rounded text-red-400 transition-colors"
                                    title="Confirmar Exclusão"
                                >
                                    <Check size={12} strokeWidth={3} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setNoteToDelete(null);
                                    }}
                                    className="p-1 hover:bg-muted rounded opacity-60 hover:opacity-100 transition-colors"
                                    title="Cancelar"
                                >
                                    <X size={12} strokeWidth={2.5} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingNoteId(note.id);
                                        setEditingTitle(note.title);
                                    }}
                                    className="p-1 opacity-50 hover:opacity-100 hover:bg-muted rounded transition-colors"
                                    title="Renomear"
                                >
                                    <Pencil size={12} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setNoteToDelete(note.id);
                                    }}
                                    className="p-1 text-red-500/70 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {sortedNotes.length === 0 && (
                    <div className="text-center p-4 text-sm opacity-50 flex flex-col items-center gap-2 mt-4">
                        <FileText size={24} className="opacity-20" />
                        <span>Nenhuma nota encontrada.</span>
                        <button
                            onClick={createNote}
                            className="text-primary hover:underline mt-2"
                        >
                            Criar a primeira
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
