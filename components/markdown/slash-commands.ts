import { ViewPlugin, EditorView } from "@codemirror/view";
import { StateField, StateEffect } from "@codemirror/state";

// 1. Definition of what actions the slash command can perform
export const SLASH_ACTIONS = [
    { id: "h1", label: "Título 1", icon: "H1", desc: "Cabeçalho Grande" },
    { id: "h2", label: "Título 2", icon: "H2", desc: "Cabeçalho Médio" },
    { id: "h3", label: "Título 3", icon: "H3", desc: "Cabeçalho Pequeno" },
    { id: "bold", label: "Negrito", icon: "B", desc: "Texto em negrito" },
    { id: "italic", label: "Itálico", icon: "I", desc: "Texto em itálico" },
    { id: "underline", label: "Sublinhado", icon: "U", desc: "Texto sublinhado" },
    { id: "strikethrough", label: "Riscado", icon: "S", desc: "Texto riscado" },
    { id: "highlight", label: "Destaque", icon: "H", desc: "Destacar texto" },
    { id: "ul", label: "Lista de Marcadores", icon: "•", desc: "Lista simples" },
    { id: "ol", label: "Lista Numerada", icon: "1.", desc: "Lista ordenada" },
    { id: "task", label: "Lista de Tarefas", icon: "☑", desc: "Checklist" },
    { id: "quote", label: "Citação", icon: "”", desc: "Bloco de Citação" },
    { id: "code", label: "Bloco de Código", icon: "</>", desc: "Inserir Código" },
    { id: "inline-code", label: "Código Inline", icon: "<>", desc: "Código na linha" },
    { id: "table", label: "Tabela", icon: "▦", desc: "Inserir Tabela" },
    { id: "link", label: "Link", icon: "🔗", desc: "Inserir URL" },
    { id: "image", label: "Imagem", icon: "🖼", desc: "Inserir Imagem" },
    { id: "hr", label: "Divisor", icon: "—", desc: "Linha Horizontal" },
    { id: "callout-info", label: "Informação", icon: "💡", desc: "Bloco de Informação" },
    { id: "callout-tip", label: "Dica", icon: "✨", desc: "Dica ou Sucesso" },
    { id: "callout-warning", label: "Aviso", icon: "⚠️", desc: "Bloco de Atenção" },
    { id: "callout-danger", label: "Perigo", icon: "🚨", desc: "Erro Crítico" },

    // Utilities
    { id: 'toggle', label: 'Toggle List', icon: '🔽', desc: 'Bloco Retrátil' },
    { id: 'toc', label: 'Índice', icon: '☰', desc: 'Gerar sumário (TOC)' },
    { id: "frontmatter", label: "Propriedades", icon: "📑", desc: "Cabeçalho de Documento YAML" },
];

export interface SlashCommandState {
    active: boolean;
    pos: number;
    query: string;
    selectedIndex: number;
}

// 2. The state effects to trigger open/close/updates
export const closeSlashCommand = StateEffect.define<void>();
export const setSlashIndex = StateEffect.define<{ index: number }>();

// 3. The state field that tracks if the menu is open, query, etc. Purely derived for performance.
export const slashCommandState = StateField.define<SlashCommandState>({
    create() {
        return { active: false, pos: 0, query: "", selectedIndex: 0 };
    },
    update(value, tr) {
        let next = value;
        let changed = false;

        // Handle explicit keyboard effects (ArrowUp/Down, Close)
        for (let effect of tr.effects) {
            if (effect.is(closeSlashCommand)) {
                return { active: false, pos: 0, query: "", selectedIndex: 0 };
            } else if (effect.is(setSlashIndex)) {
                return { ...next, selectedIndex: effect.value.index };
            }
        }

        // Derive active/query state directly from transactions instead of recursive dispatches
        if (tr.docChanged || tr.selection) {
            const head = tr.newSelection.main.head;
            const line = tr.newDoc.lineAt(head);
            const textBeforeCursor = line.text.slice(0, head - line.from);

            const slashMatch = textBeforeCursor.match(/(?:^|\s)\/([a-zA-Z0-9-]*)$/);

            if (slashMatch) {
                const query = slashMatch[1];
                const pos = head - query.length;

                if (!next.active || next.pos !== pos || next.query !== query) {
                    // Filter actions to clamp selected index
                    const filtered = SLASH_ACTIONS.filter(a =>
                        a.label.toLowerCase().includes(query.toLowerCase()) ||
                        a.id.toLowerCase().includes(query.toLowerCase())
                    );
                    const clampedIndex = next.active ? Math.min(next.selectedIndex, Math.max(0, filtered.length - 1)) : 0;

                    next = { active: true, pos, query, selectedIndex: clampedIndex };
                    changed = true;
                }
            } else if (next.active) {
                // We deleted the slash or typed a space
                next = { active: false, pos: 0, query: "", selectedIndex: 0 };
                changed = true;
            }
        }

        return changed ? next : value;
    }
});

// 4. The View Plugin that only handles Keyboard events (no longer parses text to dispatch updates)
export const slashCommandPlugin = (onAction: (id: string, view: EditorView) => void) => ViewPlugin.fromClass(class {
    // Empty class, logic moved to state field and event handlers
}, {
    eventHandlers: {
        keydown: (e, view) => {
            const state = view.state.field(slashCommandState, false);
            if (!state || !state.active) return false;

            const filteredActions = SLASH_ACTIONS.filter(a =>
                a.label.toLowerCase().includes(state.query.toLowerCase()) ||
                a.id.toLowerCase().includes(state.query.toLowerCase())
            );

            if (e.key === "ArrowDown") {
                e.preventDefault();
                const nextIndex = (state.selectedIndex + 1) % filteredActions.length;
                view.dispatch({ effects: setSlashIndex.of({ index: nextIndex }) });
                return true;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                const nextIndex = (state.selectedIndex - 1 + filteredActions.length) % filteredActions.length;
                view.dispatch({ effects: setSlashIndex.of({ index: nextIndex }) });
                return true;
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                const action = filteredActions[state.selectedIndex];
                if (action) {
                    // Close menu and trigger action
                    view.dispatch({
                        changes: {
                            from: state.pos - 1,   // delete the preceding slash
                            to: state.pos + state.query.length, // delete the typed query
                            insert: ""
                        },
                        effects: closeSlashCommand.of()
                    });

                    // Trigger the actual markdown action via our injected callback
                    setTimeout(() => onAction(action.id, view), 10);
                }
                return true;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                view.dispatch({ effects: closeSlashCommand.of() });
                return true;
            }
            return false;
        }
    }
});
