import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  generateFullAnalysis, 
  SolutionAnalysis, 
  AnalysisInput 
} from '../lib/gemini-analyst';
import './SolutionArchitect.css';
import mermaid from 'mermaid';

export default function SolutionArchitect() {
  const navigate = useNavigate();
  
  // Form state
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  const [notebookContext, setNotebookContext] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [analysis, setAnalysis] = useState<SolutionAnalysis | null>(null);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  // Load projects when client changes
  useEffect(() => {
    if (selectedClientId) {
      loadProjects(selectedClientId);
    } else {
      setProjects([]);
      setSelectedProjectId('');
    }
  }, [selectedClientId]);

  // Render mermaid when analysis is loaded
  useEffect(() => {
    if (analysis) {
      mermaid.initialize({ startOnLoad: false, theme: 'default' });
      mermaid.run({
        querySelector: '.mermaid'
      });
    }
  }, [analysis]);

  async function loadClients() {
    try {
      const { data, error } = await supabase.from('clients').select('id, name').order('name');
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  }

  async function loadProjects(clientId: string) {
    try {
      const { data, error } = await supabase.from('projects').select('id, name').eq('client_id', clientId).order('name');
      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  }

  const handleGenerateAnalysis = async () => {
    if (!selectedClientId || !selectedProjectId) {
      alert('Por favor selecciona un cliente y un proyecto.');
      return;
    }
    if (!notebookContext.trim()) {
      alert('Por favor ingresa el contexto de NotebookLM.');
      return;
    }

    const client = clients.find(c => c.id === selectedClientId);
    const project = projects.find(p => p.id === selectedProjectId);

    setIsAnalyzing(true);
    setAnalysisStatus('Iniciando extracción y análisis profundo...');
    
    try {
      const input: AnalysisInput = {
        clientName: client?.name || '',
        projectName: project?.name || '',
        notebookContext: notebookContext,
        additionalContext: additionalContext
      };

      setAnalysisStatus('Procesando datos con Gemini 2.5 Flash...');
      const result = await generateFullAnalysis(input);
      setAnalysis(result);
      
      setAnalysisStatus('Guardando análisis en Supabase...');
      // Save to Supabase
      const { data, error } = await supabase
        .from('solution_analyses')
        .insert({
          client_id: selectedClientId,
          project_id: selectedProjectId,
          analysis_json: result
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        setSavedAnalysisId(data.id);
      }
      
    } catch (err: any) {
      console.error('Analysis error:', err);
      alert('Error al generar el análisis: ' + err.message);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus('');
    }
  };

  const handleGoToQuoter = () => {
    if (savedAnalysisId) {
      navigate(`/smart-quoter?analysisId=${savedAnalysisId}`);
    }
  };

  return (
    <div className="sa-page">
      <div className="sa-header">
        <h1>AI Solution Architect</h1>
        <p>Análisis profundo y diseño de soluciones basado en IA</p>
      </div>

      <div className="sa-grid">
        {/* LEFT COLUMN: Input Form */}
        <div className="sa-left">
          <div className="sa-panel">
            <h3>1. VINCULACIÓN</h3>
            <div className="sa-field-group">
              <label className="sa-label">Cliente</label>
              <select className="sa-select" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                <option value="">-- Seleccionar --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="sa-field-group">
              <label className="sa-label">Proyecto</label>
              <select className="sa-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} disabled={!selectedClientId}>
                <option value="">-- Seleccionar --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <h3 style={{ marginTop: '24px' }}>2. CONTEXTO DE DATOS</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
              Pega aquí la información extraída de NotebookLM o pídele al Agente IA (Antigravity) que recolecte la información de tus cuadernos locales usando MCP.
            </p>
            <div className="sa-field-group">
              <label className="sa-label">Contexto NotebookLM (Requerido)</label>
              <textarea 
                className="sa-textarea" 
                placeholder="Pega el resumen del negocio, problemas, etc."
                value={notebookContext}
                onChange={e => setNotebookContext(e.target.value)}
              />
            </div>
            <div className="sa-field-group">
              <label className="sa-label">Contexto Adicional (Opcional)</label>
              <textarea 
                className="sa-textarea" 
                placeholder="Notas de reuniones, links de sitios web, etc."
                value={additionalContext}
                onChange={e => setAdditionalContext(e.target.value)}
              />
            </div>

            <div className="sa-actions">
              <button 
                className="sa-btn sa-btn-primary" 
                onClick={handleGenerateAnalysis}
                disabled={isAnalyzing || !selectedClientId || !selectedProjectId || !notebookContext.trim()}
              >
                {isAnalyzing ? 'Generando...' : 'Generar Análisis IA'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Analysis Output */}
        <div className="sa-right">
          <div className="sa-panel" style={{ minHeight: '600px' }}>
            {isAnalyzing ? (
              <div className="sa-loading">
                <div className="spinner"></div>
                <div className="step">{analysisStatus}</div>
                <p>Esto puede tomar hasta 30 segundos...</p>
              </div>
            ) : analysis ? (
              <div className="sa-results">
                <div className="sa-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>{analysis.company_info.name}</h2>
                    <p style={{ fontSize: '14px', color: '#666' }}>{analysis.company_info.industry}</p>
                  </div>
                  {savedAnalysisId && (
                    <button className="sa-btn sa-btn-gold" style={{ width: 'auto', padding: '8px 16px' }} onClick={handleGoToQuoter}>
                      Ir al Smart Quoter ➔
                    </button>
                  )}
                </div>

                <div className="sa-section">
                  <h3 className="sa-section-title">Resumen Ejecutivo</h3>
                  <div className="sa-summary">{analysis.executive_summary}</div>
                </div>

                <div className="sa-section">
                  <h3 className="sa-section-title">Problemas Detectados</h3>
                  {analysis.problems.map((p, i) => (
                    <div key={i} className="sa-problem-card">
                      <p>{p.description}</p>
                      <div className="sa-badges">
                        <span className={`sa-badge sa-badge-${p.severity.toLowerCase()}`}>{p.severity}</span>
                        <span className={`sa-badge sa-badge-${p.type.substring(0,4).toLowerCase()}`}>{p.type}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sa-section">
                  <h3 className="sa-section-title">Arquitectura Propuesta</h3>
                  <div className="mermaid" style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #eee' }}>
                    {analysis.architecture_mermaid}
                  </div>
                </div>

                <div className="sa-section">
                  <h3 className="sa-section-title">Roadmap de Features</h3>
                  {analysis.features.map((f, i) => (
                    <div key={i} className="sa-feature-row">
                      <div>
                        <div className="name">{f.name}</div>
                        <div className="desc">{f.description}</div>
                      </div>
                      <span className={`sa-badge sa-badge-${f.resolution_mode === 'CONSULTORÍA' ? 'cons' : f.resolution_mode === 'DESARROLLO' ? 'dev' : 'mix'}`}>{f.resolution_mode}</span>
                      <span className={`sa-badge sa-badge-${f.complexity.toLowerCase() === 'simple' ? 'baja' : f.complexity.toLowerCase() === 'moderada' ? 'media' : 'alta'}`}>{f.complexity}</span>
                      <span className="sa-badge" style={{ background: '#eee', color: '#555' }}>{f.priority.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>

              </div>
            ) : (
              <div className="sa-empty">
                <div className="icon">🧠</div>
                <h3>Sin análisis generado</h3>
                <p>Selecciona un cliente y proporciona el contexto para que el AI Solution Architect diseñe una propuesta estructurada.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
