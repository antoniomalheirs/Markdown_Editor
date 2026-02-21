import React from 'react';
import { Bold, Italic, Link, Code, Type, Heading1, Heading2 } from 'lucide-react';

interface FloatingMenuProps {
    top: number;
    left: number;
    show: boolean;
    onAction: (actionId: string) => void;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({ top, left, show, onAction }) => {
    if (!show) return null;

    const btnClass = "p-1.5 text-foreground/70 hover:text-foreground hover:bg-muted/80 rounded transition-colors flex items-center justify-center";

    return (
        <div
            className="absolute z-50 flex items-center gap-1 p-1 bg-background border border-gray-200 dark:border-gray-800 shadow-lg rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{
                top: `${top}px`, // Exact position calculated by parent
                left: `${left}px`,
                transform: 'translateX(-50%)' // Center horizontally
            }}
            onMouseDown={(e) => {
                // Prevent Editor from losing focus and wiping selection when clicking menu
                e.preventDefault();
            }}
        >
            <button className={btnClass} onClick={() => onAction('bold')} title="Bold">
                <Bold size={15} />
            </button>
            <button className={btnClass} onClick={() => onAction('italic')} title="Italic">
                <Italic size={15} />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button className={btnClass} onClick={() => onAction('h2')} title="Heading 2">
                <Heading2 size={15} />
            </button>
            <button className={btnClass} onClick={() => onAction('inline-code')} title="Code">
                <Code size={15} />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button className={btnClass} onClick={() => onAction('link')} title="Link">
                <Link size={15} />
            </button>
        </div>
    );
};
