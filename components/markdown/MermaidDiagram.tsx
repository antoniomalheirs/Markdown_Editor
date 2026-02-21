import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Maximize2, Minimize2 } from 'lucide-react';

// Initialize mermaid with generic sensible defaults
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'inherit',
    suppressErrorRendering: true,
});

interface MermaidDiagramProps {
    chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const renderDiagram = async () => {
            if (!chart || !containerRef.current) return;

            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

            try {
                setError(null);
                const { svg } = await mermaid.render(id, chart);

                if (isMounted) {
                    setSvgContent(svg);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err?.message || 'Syntax error in Mermaid diagram');
                    console.error('Mermaid rendering failed', err);
                }

                // Cleanup stray error UI elements that mermaid might attach to the body
                const dElement = document.getElementById('d' + id);
                if (dElement) {
                    dElement.remove();
                }
            }
        };

        renderDiagram();

        return () => {
            isMounted = false;
        };
    }, [chart]);

    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-md font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                <div className="font-bold mb-2">Mermaid Syntax Error:</div>
                {error}
            </div>
        );
    }

    return (
        <div
            className={`group relative flex justify-center items-center p-6 bg-muted/20 border border-gray-200 dark:border-gray-800 rounded-lg ${isFullscreen
                ? 'fixed inset-4 z-50 bg-background/95 backdrop-blur shadow-2xl overflow-auto'
                : 'my-6'
                }`}
        >
            <button
                onClick={toggleFullscreen}
                className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-muted text-foreground/50 hover:text-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200 dark:border-gray-800"
                title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <div
                ref={containerRef}
                className="max-w-full overflow-x-auto diagram-container"
                dangerouslySetInnerHTML={{ __html: svgContent }}
            />
        </div>
    );
};

export default MermaidDiagram;
