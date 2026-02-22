import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { APP_CONFIG } from "@/lib/constants";

export interface Note {
    id: string;
    title: string;
    content: string;
    updatedAt: number;
    createdAt: number;
    hasManualTitle?: boolean;
}

export type SaveStatus = "saved" | "saving" | "error";

interface WorkspaceState {
    notes: Note[];
    activeNoteId: string | null;
    isSidebarOpen: boolean;
    saveStatus: SaveStatus;

    // Actions
    createNote: () => void;
    updateNote: (id: string, content: string) => void;
    deleteNote: (id: string) => void;
    renameNote: (id: string, newTitle: string) => void;
    setActiveNote: (id: string | null) => void;
    toggleSidebar: () => void;
    setSaveStatus: (status: SaveStatus) => void;

    // Migration helpers
    migrateLegacyContent: () => void;
}

const getDefaultContent = () => APP_CONFIG.defaultContent;

export const useWorkspace = create<WorkspaceState>()(
    persist(
        (set, get) => ({
            notes: [],
            activeNoteId: null,
            isSidebarOpen: true,
            saveStatus: "saved",

            createNote: () => {
                const newNote: Note = {
                    id: uuidv4(),
                    title: "Untitled.md",
                    content: "# Novo Arquivo\n\nComece a escrever aqui...",
                    updatedAt: Date.now(),
                    createdAt: Date.now(),
                };

                set((state) => ({
                    notes: [newNote, ...state.notes],
                    activeNoteId: newNote.id,
                }));
            },

            updateNote: (id, content) => {
                set((state) => ({
                    notes: state.notes.map((note) => {
                        if (note.id !== id) return note;

                        // Try to extract an H1 title from the first few lines
                        let title = note.hasManualTitle ? note.title : "Untitled.md";
                        if (!note.hasManualTitle) {
                            const lines = content.split('\n');
                            for (let i = 0; i < Math.min(lines.length, 5); i++) {
                                const line = lines[i].trim();
                                if (line.startsWith('# ')) {
                                    const rawTitle = line.substring(2).trim();
                                    if (rawTitle) {
                                        // Sanitize filename lightly
                                        title = rawTitle.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_') + ".md";
                                        if (title === ".md") title = "Untitled.md";
                                    }
                                    break;
                                }
                            }
                        }

                        return {
                            ...note,
                            content,
                            title,
                            updatedAt: Date.now(),
                        };
                    })
                }));
            },

            renameNote: (id, newTitle) => {
                set((state) => ({
                    notes: state.notes.map((note) => {
                        if (note.id !== id) return note;
                        const sanitized = newTitle.trim() || 'Untitled';
                        const finalTitle = sanitized.endsWith('.md') ? sanitized : `${sanitized}.md`;
                        return {
                            ...note,
                            title: finalTitle,
                            hasManualTitle: true,
                            updatedAt: Date.now(),
                        };
                    })
                }));
            },

            deleteNote: (id) => {
                set((state) => {
                    const newNotes = state.notes.filter((n) => n.id !== id);
                    return {
                        notes: newNotes,
                        // If we deleted the active note, fallback to the first available, or null
                        activeNoteId: state.activeNoteId === id
                            ? (newNotes.length > 0 ? newNotes[0].id : null)
                            : state.activeNoteId
                    };
                });
            },

            setActiveNote: (id) => set({ activeNoteId: id }),

            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

            setSaveStatus: (status) => set({ saveStatus: status }),

            migrateLegacyContent: () => {
                const state = get();

                // --- GARBAGE COLLECTION ---
                // Clean up empty or untouched "Novo Arquivo" notes to avoid saving trash
                const hasGarbage = state.notes.some(n =>
                    !n.content.trim() ||
                    n.content === "# Novo Arquivo\n\nComece a escrever aqui..."
                );

                if (hasGarbage && state.notes.length > 1) {
                    set((s) => ({
                        notes: s.notes.filter(n =>
                            n.content.trim() !== "" &&
                            n.content !== "# Novo Arquivo\n\nComece a escrever aqui..."
                        )
                    }));
                }

                if (state.notes.length > 0) return; // Already migrated or started fresh

                // Check if user has legacy raw string in local storage
                const legacyContent = localStorage.getItem(APP_CONFIG.storageKey);
                if (legacyContent) {
                    const migratedNote: Note = {
                        id: uuidv4(),
                        title: "Legacy_Note.md",
                        content: legacyContent,
                        updatedAt: Date.now(),
                        createdAt: Date.now(),
                    };
                    set({
                        notes: [migratedNote],
                        activeNoteId: migratedNote.id
                    });
                    // Clean up legacy key to prevent double migration
                    localStorage.removeItem(APP_CONFIG.storageKey);
                } else {
                    // Start fresh
                    get().createNote();
                    // Overwrite default content to match our config for the first time
                    set((s) => ({
                        notes: s.notes.map(n => n.id === s.activeNoteId ? { ...n, content: getDefaultContent(), title: "Welcome.md" } : n)
                    }));
                }
            }
        }),
        {
            name: "zen-workspace-storage",
            partialize: (state) => ({
                notes: state.notes,
                activeNoteId: state.activeNoteId,
                isSidebarOpen: state.isSidebarOpen
            }),
        }
    )
);

if (typeof window !== "undefined") {
    (window as any).useWorkspaceStore = useWorkspace;
}
