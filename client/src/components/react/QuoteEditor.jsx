import { useState, useCallback, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import './QuoteEditor.css';
import HotelBookingWizard from './HotelBookingWizard.jsx';

function formatCurrency(n) {
  return (n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function computeSubtotal(item) {
  return Math.round(item.unitPrice * item.qty * (1 - (item.discount || 0) / 100) * 100) / 100;
}

function computeTotals(items, taxRate = 0.16) {
  const subtotalGross = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  const discountAmount = items.reduce((a, i) => a + i.unitPrice * i.qty * ((i.discount || 0) / 100), 0);
  const subtotal = subtotalGross - discountAmount;
  const tax = subtotal * taxRate;
  return {
    subtotal: Math.round(subtotalGross * 100) / 100,
    discount: Math.round(discountAmount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round((subtotal + tax) * 100) / 100,
  };
}

function emptyItem() {
  return { _id: `new-${Date.now()}`, name: '', qty: 1, unitPrice: 0, discount: 0, subtotal: 0 };
}

export default function QuoteEditor({ quote: initialQuote, workspaceId, apiUrl = 'http://localhost:3000' }) {
  const [quote, setQuote] = useState(initialQuote);
  const [items, setItems] = useState(initialQuote?.items || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [showHotelWizard, setShowHotelWizard] = useState(false);
  const [sendCooldown, setSendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  function startCooldown() {
    setSendCooldown(50);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setSendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current); cooldownRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  const taxRate = quote?.taxRate ?? 0.16;
  const totals = computeTotals(items, taxRate);

  function getToken() {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : '';
  }

  const saveItems = useCallback(async (newItems) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/v1/quotes/${quote._id}/items?workspaceId=${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
        body: JSON.stringify({ items: newItems.map(({ _id: id, ...rest }) => ({ ...rest })) }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Error guardando');
      setQuote(body.data.quote);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [quote?._id, workspaceId, apiUrl]);

  function updateItem(index, field, value) {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const next = { ...item, [field]: field === 'qty' || field === 'unitPrice' || field === 'discount' ? parseFloat(value) || 0 : value };
      next.subtotal = computeSubtotal(next);
      return next;
    });
    setItems(updated);
  }

  function addItem() {
    setItems([...items, emptyItem()]);
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index));
  }

  function handleSave() {
    saveItems(items);
  }

  async function handleSend() {
    const email = quote?.client?.email;
    if (!email) {
      Swal.fire({ icon: 'warning', title: 'Sin email', text: 'El cliente no tiene email configurado.' });
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: '¿Enviar cotización?',
      text: `Se enviará la cotización a ${email}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;

    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${apiUrl}/api/v1/quotes/${quote._id}/send?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Error enviando');
      setQuote(body.data.quote);
      Swal.fire({ icon: 'success', title: 'Enviada', text: 'Cotización enviada por correo', timer: 2500, showConfirmButton: false });
      startCooldown();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const clientLabel = [quote?.client?.name, quote?.client?.company].filter(Boolean).join(' — ');
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar cotización?',
      text: `${clientLabel ? `Cotización de ${clientLabel}. ` : ''}Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/v1/quotes/${quote._id}?workspaceId=${workspaceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Error al eliminar');
      window.location.href = '/app/cotizaciones';
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="quote-editor">
      <div className="quote-editor__header">
        <div className="quote-editor__client-info">
          <h2 className="quote-editor__client-name">{quote?.client?.name}</h2>
          {quote?.client?.company && <span className="quote-editor__client-company">{quote.client.company}</span>}
          <span className={`badge badge--${quote?.status}`}>{quote?.status}</span>
        </div>
        <div className="quote-editor__actions">
          {error && <span className="quote-editor__error">{error}</span>}
          {saved && <span className="quote-editor__saved">Guardado ✓</span>}
          {successMsg && <span className="quote-editor__saved">{successMsg}</span>}
          <button className="btn btn--secondary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          {['draft', 'rejected', 'expired'].includes(quote?.status) ? (
            <button className="btn btn--primary" onClick={handleSend} disabled={saving || sendCooldown > 0}>
              {saving ? 'Enviando...' : sendCooldown > 0 ? `Espera ${sendCooldown}s` : 'Enviar cotización'}
            </button>
          ) : (
            <button className="btn btn--secondary btn--sm" onClick={handleSend} disabled={saving || sendCooldown > 0}>
              {saving ? 'Enviando...' : sendCooldown > 0 ? `Espera ${sendCooldown}s` : 'Reenviar cotización'}
            </button>
          )}
          {quote?.publicToken && (
            <a
              href={`/q/${quote.publicToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--secondary"
            >
              Ver vista pública
            </a>
          )}
          <button className="btn btn--danger" onClick={handleDelete} disabled={saving}>
            Eliminar
          </button>
        </div>
      </div>

      <div className="quote-editor__table">
        <div className="quote-editor__table-header">
          <span>Descripción</span>
          <span>Qty</span>
          <span>Precio unit.</span>
          <span>Desc. %</span>
          <span>Subtotal</span>
          <span></span>
        </div>

        {items.map((item, i) => (
          <div key={item._id || i} className="quote-editor__row">
            <input
              className="form-input"
              value={item.name}
              onChange={(e) => updateItem(i, 'name', e.target.value)}
              placeholder="Descripción del producto"
            />
            <input
              className="form-input quote-editor__input--number"
              type="number"
              min="1"
              value={item.qty}
              onChange={(e) => updateItem(i, 'qty', e.target.value)}
            />
            <input
              className="form-input quote-editor__input--number"
              type="number"
              min="0"
              step="0.01"
              value={item.unitPrice}
              onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
            />
            <input
              className="form-input quote-editor__input--number"
              type="number"
              min="0"
              max="100"
              value={item.discount || 0}
              onChange={(e) => updateItem(i, 'discount', e.target.value)}
            />
            <span className="quote-editor__subtotal">${formatCurrency(item.subtotal)}</span>
            <button className="btn btn--danger btn--sm" onClick={() => removeItem(i)} title="Eliminar línea">×</button>
          </div>
        ))}

        <button className="btn btn--secondary quote-editor__add-row" onClick={addItem}>
          + Agregar línea
        </button>
        <button className="btn btn--secondary quote-editor__add-row" onClick={() => setShowHotelWizard(true)}>
          + Agregar habitación
        </button>
      </div>

      <div className="quote-editor__totals">
        <div className="quote-editor__totals-row">
          <span>Subtotal</span>
          <span>${formatCurrency(totals.subtotal)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="quote-editor__totals-row quote-editor__totals-row--discount">
            <span>Descuento</span>
            <span>− ${formatCurrency(totals.discount)}</span>
          </div>
        )}
        <div className="quote-editor__totals-row">
          <span>IVA ({(taxRate * 100).toFixed(0)}%)</span>
          <span>${formatCurrency(totals.tax)}</span>
        </div>
        <div className="quote-editor__totals-row quote-editor__totals-row--total">
          <span>Total</span>
          <span>${formatCurrency(totals.total)}</span>
        </div>
      </div>

      {showHotelWizard && (
        <HotelBookingWizard
          onConfirm={(newRoomItems) => {
            const timestamped = newRoomItems.map((item, i) => ({
              ...item,
              _id: `new-${Date.now()}-${i}`,
            }));
            const newItems = [...items, ...timestamped];
            setItems(newItems);
            saveItems(newItems);
            setShowHotelWizard(false);
          }}
          onCancel={() => setShowHotelWizard(false)}
        />
      )}
    </div>
  );
}
