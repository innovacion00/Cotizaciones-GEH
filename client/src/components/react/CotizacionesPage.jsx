import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../../lib/api.js';
import { ensureWorkspaceId } from '../../lib/auth.js';
import HotelBookingWizard from './HotelBookingWizard.jsx';
import './CotizacionesPage.css';

export default function CotizacionesPage() {
  const [workspaceId, setWorkspaceIdState] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingClient, setPendingClient] = useState(null);
  const [clientForm, setClientForm] = useState({
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    clientPhone: '',
  });

  const loadQuotes = useCallback(async (status = '', wsId = workspaceId) => {
    if (!wsId) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ workspaceId: wsId, limit: '50' });
      if (status) params.set('status', status);
      const data = await api.get(`/api/v1/quotes?${params}`);
      setQuotes(data.quotes || []);
    } catch (err) {
      setError(err.message || 'Error al cargar cotizaciones');
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const wsId = await ensureWorkspaceId();
      if (cancelled) return;
      if (!wsId) {
        setError('No hay workspace configurado. Crea uno o inicia sesión de nuevo.');
        setLoading(false);
        return;
      }
      setWorkspaceIdState(wsId);
      await loadQuotes('', wsId);
    })();
    return () => { cancelled = true; };
  }, [loadQuotes]);

  function openClientModal() {
    setClientForm({ clientName: '', clientCompany: '', clientEmail: '', clientPhone: '' });
    setShowClientModal(true);
  }

  function closeClientModal() {
    setShowClientModal(false);
    setPendingClient(null);
  }

  function handleClientSubmit(e) {
    e.preventDefault();
    setPendingClient({
      name: clientForm.clientName,
      company: clientForm.clientCompany || undefined,
      email: clientForm.clientEmail || undefined,
      phone: clientForm.clientPhone || undefined,
    });
    setShowClientModal(false);
    setShowWizard(true);
  }

  async function handleConfirmItems(items) {
    if (creating) return;
    setCreating(true);
    try {
      const data = await api.post(`/api/v1/quotes?workspaceId=${workspaceId}`, {
        client: pendingClient,
        items,
        taxRate: 0.19,
      });
      window.location.href = `/app/cotizaciones/${data.quote._id}`;
    } catch (err) {
      setCreating(false);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Ha ocurrido un error al intentar crear la cotización. Intente nuevamente o más tarde.' });
    }
  }

  async function handleDeleteQuote(quoteId, clientName) {
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar cotización?',
      text: `¿Eliminar la cotización de ${clientName}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/api/v1/quotes/${quoteId}?workspaceId=${workspaceId}`);
      await loadQuotes(statusFilter);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: `Error al eliminar: ${err.message}` });
    }
  }

  return (
    <div className="cotizaciones">
      <div className="cotizaciones__toolbar">
        <button type="button" className="btn btn--primary" onClick={openClientModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva cotización
        </button>
        <div className="cotizaciones__filters">
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              loadQuotes(e.target.value);
            }}
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="viewed">Vista</option>
            <option value="accepted">Aceptada</option>
            <option value="rejected">Rechazada</option>
            <option value="expired">Expirada</option>
          </select>
        </div>
      </div>

      <div className="cotizaciones__list">
        {loading && <p className="cotizaciones__loading">Cargando cotizaciones...</p>}
        {!loading && error && <p className="cotizaciones__error">Error: {error}</p>}
        {!loading && !error && !quotes.length && (
          <p className="cotizaciones__empty">No hay cotizaciones. ¡Crea la primera!</p>
        )}
        {!loading && !error && quotes.length > 0 && (
          <>
            <div className="cotizaciones__header-row">
              <span>Cliente</span>
              <span>Empresa</span>
              <span>Hotel</span>
              <span>Responsable</span>
              <span>Estado</span>
              <span>Total</span>
              <span>Fecha</span>
              <span />
            </div>
            {quotes.map((q) => {
              const hotelName = q.items?.find((i) => i.booking?.hotelName)?.booking?.hotelName || '—';
              return (
              <div key={q._id} className="cotizaciones__row">
                <div className="cotizaciones__cell cotizaciones__cell--client">{q.client.name}</div>
                <div className="cotizaciones__cell">{q.client.company || '—'}</div>
                <div className="cotizaciones__cell">{hotelName}</div>
                <div className="cotizaciones__cell">{q.owner?.name || '—'}</div>
                <div className="cotizaciones__cell">
                  <span className={`badge badge--${q.status}`}>{q.status}</span>
                </div>
                <div className="cotizaciones__cell cotizaciones__cell--total">
                  ${(q.totals?.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </div>
                <div className="cotizaciones__cell cotizaciones__cell--date">
                  {new Date(q.updatedAt).toLocaleDateString('es-CO')}
                </div>
                <div className="cotizaciones__cell cotizaciones__cell--actions">
                  <a href={`/app/cotizaciones/${q._id}`} className="btn btn--secondary btn--sm">
                    Editar
                  </a>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => handleDeleteQuote(q._id, q.client.name)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );})}
          </>
        )}
      </div>

      {showClientModal && (
        <div className="modal">
          <div className="modal__backdrop" onClick={closeClientModal} />
          <div className="modal__content card">
            <h2 className="modal__title">Nueva cotización</h2>
            <form className="modal__form" onSubmit={handleClientSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del cliente *</label>
                <input
                  className="form-input"
                  name="clientName"
                  required
                  value={clientForm.clientName}
                  onChange={(e) => setClientForm((f) => ({ ...f, clientName: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Empresa</label>
                <input
                  className="form-input"
                  name="clientCompany"
                  value={clientForm.clientCompany}
                  onChange={(e) => setClientForm((f) => ({ ...f, clientCompany: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  name="clientEmail"
                  value={clientForm.clientEmail}
                  onChange={(e) => setClientForm((f) => ({ ...f, clientEmail: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  className="form-input"
                  name="clientPhone"
                  value={clientForm.clientPhone}
                  onChange={(e) => setClientForm((f) => ({ ...f, clientPhone: e.target.value }))}
                />
              </div>
              <div className="modal__actions">
                <button type="button" className="btn btn--secondary" onClick={closeClientModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary">Siguiente →</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWizard && (
        <HotelBookingWizard
          onConfirm={handleConfirmItems}
          submitting={creating}
          onCancel={() => {
            setShowWizard(false);
            setShowClientModal(true);
          }}
        />
      )}
    </div>
  );
}
