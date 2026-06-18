import { useState, useEffect } from 'react';
import api from '../../lib/api.js';
import { ensureWorkspaceId } from '../../lib/auth.js';
import QuoteEditor from './QuoteEditor.jsx';
import './QuoteEditorPage.css';

const API_URL = import.meta.env.API_URL || 'http://localhost:3000';

export default function QuoteEditorPage({ quoteId }) {
  const [status, setStatus] = useState('loading');
  const [quote, setQuote] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!quoteId) {
        setStatus('error');
        setError('Cotización no encontrada.');
        return;
      }

      try {
        const wsId = await ensureWorkspaceId();
        if (cancelled) return;
        if (!wsId) {
          setStatus('error');
          setError('No hay workspace configurado.');
          return;
        }

        const data = await api.get(`/api/v1/quotes/${quoteId}?workspaceId=${wsId}`);
        if (cancelled) return;

        setQuote(data.quote);
        setWorkspaceId(wsId);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setError(err.message || 'No se pudo cargar la cotización.');
      }
    }

    load();
    return () => { cancelled = true; };
  }, [quoteId]);

  if (status === 'loading') {
    return <p className="editor-loading">Cargando cotización...</p>;
  }

  if (status === 'error') {
    return (
      <div className="editor-error">
        <p>{error}</p>
        <a href="/app/cotizaciones" className="btn btn--secondary">Volver a cotizaciones</a>
      </div>
    );
  }

  return <QuoteEditor quote={quote} workspaceId={workspaceId} apiUrl={API_URL} />;
}
