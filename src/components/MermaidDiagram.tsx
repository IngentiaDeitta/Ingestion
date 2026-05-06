import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with a dark-compatible theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#FFD166',
    primaryTextColor: '#1A1A1A',
    primaryBorderColor: '#E0E0E0',
    lineColor: '#666666',
    secondaryColor: '#F5F5F5',
    tertiaryColor: '#FAFAFA',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '13px',
  },
  flowchart: {
    curve: 'basis',
    padding: 20,
    htmlLabels: true,
    useMaxWidth: true,
  },
  securityLevel: 'loose',
});

interface MermaidDiagramProps {
  chart: string;
  title?: string;
  className?: string;
}

export default function MermaidDiagram({ chart, title, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    if (!chart || !chart.trim()) {
      setError('No hay diagrama disponible.');
      return;
    }

    const renderDiagram = async () => {
      try {
        setError(null);
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const { svg } = await mermaid.render(id, chart.trim());
        setSvgContent(svg);
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        setError(`Error al renderizar el diagrama: ${err.message || 'Formato inválido'}`);
        setSvgContent('');
      }
    };

    renderDiagram();
  }, [chart]);

  return (
    <div className={`mermaid-diagram-container ${className}`}>
      {title && (
        <h4 style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#666666',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '12px',
        }}>
          {title}
        </h4>
      )}
      
      <div
        ref={containerRef}
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: '16px',
          padding: '24px',
          overflow: 'auto',
          minHeight: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {error ? (
          <div style={{
            color: '#E74C3C',
            fontSize: '13px',
            textAlign: 'center',
            padding: '20px',
          }}>
            <p style={{ fontWeight: 600, marginBottom: '4px' }}>⚠️ {error}</p>
            <pre style={{
              fontSize: '11px',
              color: '#999',
              maxHeight: '100px',
              overflow: 'auto',
              textAlign: 'left',
              background: '#f5f5f5',
              padding: '8px',
              borderRadius: '8px',
              marginTop: '8px',
            }}>
              {chart}
            </pre>
          </div>
        ) : (
          <div 
            dangerouslySetInnerHTML={{ __html: svgContent }}
            style={{ width: '100%', textAlign: 'center' }}
          />
        )}
      </div>
    </div>
  );
}
