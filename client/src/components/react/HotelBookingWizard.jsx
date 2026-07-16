import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './HotelBookingWizard.css';
import { getHotelImageUrl } from '../../lib/hotelImages.js';
import { getRoomImageUrl } from '../../lib/roomImages.js';
import { BANK_ACCOUNTS, getDefaultBankKey } from '../../lib/bankAccounts.js';
import { RESPONSABLES } from '../../lib/responsables.js';

const API_URL = import.meta.env.API_URL || 'http://localhost:3000';

function getToken() {
  return typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : '';
}

async function apiFetch(path) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
    credentials: 'include',
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error en la solicitud');
  return body.data;
}

function formatCOP(n) {
  return (n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDaysYMD(ymd, days) {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeNights(checkin, checkout) {
  if (!checkin || !checkout) return 0;
  return Math.max(0, Math.round((new Date(checkout) - new Date(checkin)) / 86400000));
}

function nightsLabel(checkin, checkout) {
  const n = computeNights(checkin, checkout);
  return n > 0 ? `${n} noche${n !== 1 ? 's' : ''}` : '';
}


function HotelPreview({ hotelId, hotelName, city, compact = false }) {
  const imageUrl = getHotelImageUrl(hotelId, hotelName);
  if (!hotelId || !hotelName) return null;
  return (
    <div className={`hwiz__hotel-preview${compact ? ' hwiz__hotel-preview--compact' : ''}`}>
      {imageUrl ? (
        <img className="hwiz__hotel-image" src={imageUrl} alt={hotelName} loading="lazy" />
      ) : (
        <div className="hwiz__hotel-image hwiz__hotel-image--placeholder" aria-hidden="true" />
      )}
      <div className="hwiz__hotel-info">
        <p className="hwiz__hotel-name">{hotelName}</p>
        {city && <p className="hwiz__hotel-city">{city}</p>}
      </div>
    </div>
  );
}

export default function HotelBookingWizard({ onConfirm, onCancel, submitting = false }) {
  const [step, setStep] = useState(1);
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState('');
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [childrenAges, setChildrenAges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [roomQuantities, setRoomQuantities] = useState({});
  const [manualMode, setManualMode] = useState(false);
  const [manualRooms, setManualRooms] = useState([]);
  const [bankKey, setBankKey] = useState('');
  const [responsableKey, setResponsableKey] = useState('');
  const [paymentDeadline, setPaymentDeadline] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/v1/hotels/cities').then((d) => setCities(d.cities)).catch(() => {});
  }, []);

  function handleCityChange(c) {
    setCity(c);
    setHotelId('');
    setHotelName('');
    setHotels([]);
    if (c) {
      apiFetch(`/api/v1/hotels?city=${encodeURIComponent(c)}`)
        .then((d) => setHotels(d.hotels))
        .catch(() => {});
    }
  }

  function handleHotelChange(id) {
    const hotel = hotels.find((h) => h.hotelId === id);
    setHotelId(id);
    setHotelName(hotel?.name || '');
    setBankKey(getDefaultBankKey(id) || '');
  }

  function handleChildrenCountChange(n) {
    const count = Math.max(0, parseInt(n, 10) || 0);
    setChildrenCount(count);
    setChildrenAges((prev) => {
      const arr = [...prev];
      while (arr.length < count) arr.push(0);
      return arr.slice(0, count);
    });
  }

  function handleChildAgeChange(index, value) {
    setChildrenAges((prev) => {
      const arr = [...prev];
      arr[index] = parseInt(value, 10) || 0;
      return arr;
    });
  }

  // --- Room quantity helpers ---
  function totalSelectedRooms() {
    return Object.values(roomQuantities).reduce((a, b) => a + b, 0);
  }

  function incrementRoom(index) {
    setRoomQuantities((prev) => {
      const current = prev[index] || 0;
      const max = availability?.rooms[index]?.pricing?.count;
      if (max != null && current >= max) return prev;
      return { ...prev, [index]: current + 1 };
    });
  }

  function decrementRoom(index) {
    setRoomQuantities((prev) => {
      const current = prev[index] || 0;
      if (current <= 0) return prev;
      const next = { ...prev };
      if (current === 1) delete next[index];
      else next[index] = current - 1;
      return next;
    });
  }

  // --- Manual room helpers ---
  function addManualRoom() {
    const n = availability?.nights || computeNights(checkin, checkout);
    setManualRooms((prev) => [...prev, { roomName: '', pricePerNight: 0, nights: n || 1 }]);
  }

  function updateManualRoom(index, field, value) {
    setManualRooms((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function removeManualRoom(index) {
    setManualRooms((prev) => prev.filter((_, i) => i !== index));
  }

  function validManualRooms() {
    return manualRooms.filter((r) => r.roomName.trim() && r.pricePerNight > 0 && r.nights > 0);
  }

  // --- Availability search ---
  async function buscarDisponibilidad() {
    setError('');
    setAvailability(null);
    setRoomQuantities({});
    if (!hotelId || !checkin || !checkout) {
      setError('Completa hotel, fecha de entrada y fecha de salida.');
      return;
    }
    if (checkin < todayYMD()) {
      setError('La fecha de entrada no puede ser anterior a hoy.');
      return;
    }
    const nights = computeNights(checkin, checkout);
    if (nights < 1) { setError('La fecha de salida debe ser posterior a la entrada.'); return; }

    setLoading(true);
    try {
      const childrenParam = childrenAges.length > 0 ? `&children_ages=${childrenAges.join(',')}` : '';
      const data = await apiFetch(
        `/api/v1/hotels/${hotelId}/availability?checkin=${checkin}&checkout=${checkout}&adults=${adults}${childrenParam}`
      );
      setAvailability(data);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Confirm ---
  function confirmar() {
    const selectedCount = manualMode ? validManualRooms().length : totalSelectedRooms();
    const missing = [];
    if (selectedCount === 0) missing.push('selecciona al menos 1 habitación');
    if (!responsableKey) missing.push('selecciona el responsable a cargo');
    if (!paymentDeadline) missing.push('selecciona la fecha límite de pago');
    if (missing.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: `Antes de confirmar, ${missing.join(' y ')}.`,
      });
      return;
    }

    const nights = availability?.nights || computeNights(checkin, checkout);
    const nLabel = `${nights} noche${nights !== 1 ? 's' : ''}`;
    const items = [];

    if (manualMode) {
      for (const r of validManualRooms()) {
        items.push({
          name: `${hotelName} — ${r.roomName} (${r.nights} noche${r.nights !== 1 ? 's' : ''})`,
          qty: 1,
          unitPrice: r.pricePerNight * r.nights,
          discount: 0,
          subtotal: r.pricePerNight * r.nights,
          booking: {
            city, hotelId, hotelName,
            roomId: null, roomName: r.roomName,
            checkin, checkout, nights: r.nights,
            adults, childrenAges,
            boardTypeDescription: '', refundable: '', cancellationPolicy: '',
            currency: 'COP', trm: null,
            bankAccountKey: bankKey || undefined,
            responsableKey: responsableKey || undefined,
          },
        });
      }
    } else {
      for (const [idx, qty] of Object.entries(roomQuantities)) {
        const room = availability.rooms[idx];
        if (!room || qty <= 0) continue;
        items.push({
          name: `${hotelName} — ${room.roomName} (${nLabel})`,
          qty,
          unitPrice: room.pricing.amountBeforeTax,
          discount: 0,
          subtotal: room.pricing.amountBeforeTax * qty,
          booking: {
            city, hotelId, hotelName,
            roomId: room.roomId, roomName: room.roomName,
            checkin: availability.checkin, checkout: availability.checkout, nights,
            adults: availability.adults, childrenAges: availability.childrenAges,
            boardTypeDescription: room.pricing.boardTypeDescription,
            refundable: room.pricing.refundable,
            cancellationPolicy: room.pricing.cancellationPolicy,
            currency: room.pricing.currency,
            trm: room.pricing.trm,
            bankAccountKey: bankKey || undefined,
            responsableKey: responsableKey || undefined,
          },
        });
      }
    }

    if (items.length === 0) return;
    onConfirm(items, paymentDeadline);
  }

  const canConfirm = !!bankKey && !submitting;

  const confirmCount = manualMode ? validManualRooms().length : totalSelectedRooms();
  const nights = availability?.nights || computeNights(checkin, checkout);

  return (
    <div className="hwiz-overlay">
      <div className="hwiz-backdrop" onClick={onCancel} />
      <div className="hwiz card">
        <div className="hwiz__header">
          <h2 className="hwiz__title">
            {step === 1 && 'Seleccionar hotel'}
            {step === 2 && 'Fechas y huéspedes'}
            {step === 3 && (manualMode ? 'Agregar habitaciones (manual)' : 'Habitaciones disponibles')}
          </h2>
          <button className="hwiz__close" onClick={onCancel} aria-label="Cerrar">×</button>
        </div>

        <div className="hwiz__steps">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`hwiz__step-dot${step >= s ? ' hwiz__step-dot--active' : ''}`} />
          ))}
        </div>

        {/* STEP 1 — Ciudad y Hotel */}
        {step === 1 && (
          <div className="hwiz__body">
            <div className="form-group">
              <label className="form-label">Ciudad *</label>
              <select className="form-input" value={city} onChange={(e) => handleCityChange(e.target.value)}>
                <option value="">Selecciona una ciudad</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Hotel *</label>
              <select className="form-input" value={hotelId} onChange={(e) => handleHotelChange(e.target.value)} disabled={!city}>
                <option value="">Selecciona un hotel</option>
                {hotels.map((h) => <option key={h.hotelId} value={h.hotelId}>{h.name}</option>)}
              </select>
            </div>
            <HotelPreview hotelId={hotelId} hotelName={hotelName} city={city} />
            <div className="hwiz__footer">
              <button className="btn btn--secondary" onClick={onCancel}>Cancelar</button>
              <button className="btn btn--primary" onClick={() => setStep(2)} disabled={!hotelId}>
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Fechas y huéspedes */}
        {step === 2 && (
          <div className="hwiz__body">
            <HotelPreview hotelId={hotelId} hotelName={hotelName} city={city} compact />
            {error && <p className="form-error hwiz__error">{error}</p>}
            <div className="hwiz__dates">
              <div className="form-group">
                <label className="form-label">Check-in *</label>
                <input
                  className="form-input" type="date" value={checkin} min={todayYMD()}
                  onChange={(e) => {
                    setCheckin(e.target.value);
                    if (checkout && e.target.value && checkout <= e.target.value) setCheckout('');
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Check-out *</label>
                <input
                  className="form-input" type="date" value={checkout}
                  min={checkin ? addDaysYMD(checkin, 1) : todayYMD()}
                  onChange={(e) => {
                    setCheckout(e.target.value);
                    if (paymentDeadline && e.target.value && paymentDeadline > e.target.value) setPaymentDeadline('');
                  }}
                />
              </div>
            </div>
            {nightsLabel(checkin, checkout) && (
              <p className="hwiz__nights-label">{nightsLabel(checkin, checkout)}</p>
            )}
            <div className="form-group hwiz__deadline">
              <label className="form-label">Fecha límite de pago *</label>
              <input
                className="form-input" type="date" value={paymentDeadline}
                min={todayYMD()}
                max={checkout || undefined}
                onChange={(e) => setPaymentDeadline(e.target.value)}
              />
            </div>
            <div className="hwiz__guests">
              <div className="form-group">
                <label className="form-label">Adultos *</label>
                <input className="form-input" type="number" min="1" value={adults} onChange={(e) => setAdults(parseInt(e.target.value, 10) || 1)} />
              </div>
              <div className="form-group">
                <label className="form-label">Menores</label>
                <input className="form-input" type="number" min="0" value={childrenCount} onChange={(e) => handleChildrenCountChange(e.target.value)} />
              </div>
            </div>
            {childrenCount > 0 && (
              <div className="hwiz__children-ages">
                <p className="form-label">Edad de los menores</p>
                <div className="hwiz__ages-grid">
                  {childrenAges.map((age, i) => (
                    <div key={i} className="form-group">
                      <label className="form-label hwiz__age-label">Menor {i + 1}</label>
                      <input className="form-input" type="number" min="0" max="17" value={age} onChange={(e) => handleChildAgeChange(i, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="hwiz__footer">
              <button className="btn btn--secondary" onClick={() => { setError(''); setStep(1); }}>← Atrás</button>
              <button className="btn btn--primary" onClick={buscarDisponibilidad} disabled={loading}>
                {loading ? 'Consultando...' : 'Buscar disponibilidad'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Selección de habitaciones */}
        {step === 3 && availability && (
          <div className="hwiz__body">
            <HotelPreview hotelId={hotelId} hotelName={hotelName} city={city} compact />
            {error && <p className="form-error hwiz__error">{error}</p>}
            <p className="hwiz__availability-summary">
              {hotelName} · {nights} noche{nights !== 1 ? 's' : ''} · {adults} adulto{adults !== 1 ? 's' : ''}
              {childrenAges.length > 0 && ` · ${childrenAges.length} menor${childrenAges.length !== 1 ? 'es' : ''}`}
              {manualMode && ' · Modo manual'}
            </p>

            {/* API rooms with quantity selectors */}
            {!manualMode && (
              <div className="hwiz__rooms">
                {availability.rooms.map((room, i) => {
                  const roomImageUrl = getRoomImageUrl(hotelId, room.roomId);
                  const qty = roomQuantities[i] || 0;
                  return (
                  <div
                    key={`${room.roomId}-${i}`}
                    className={`hwiz__room-card${qty > 0 ? ' hwiz__room-card--selected' : ''}${!room.available ? ' hwiz__room-card--unavailable' : ''}`}
                  >
                    <div className="hwiz__room-card-inner">
                      {roomImageUrl ? (
                        <img className="hwiz__room-image" src={roomImageUrl} alt={room.roomName} loading="lazy" />
                      ) : (
                        <div className="hwiz__room-image hwiz__room-image--placeholder" aria-hidden="true" />
                      )}
                      <div className="hwiz__room-details">
                        <div className="hwiz__room-name">{room.roomName}</div>
                        {room.available ? (
                          <>
                            <div className="hwiz__room-price">{formatCOP(room.pricing.amountBeforeTax)}<span className="hwiz__room-tax"> + IVA 19%</span></div>
                            <div className="hwiz__room-total">Total: {formatCOP(room.pricing.amountAfterTax)}</div>
                            <div className="hwiz__room-meta">
                              {room.pricing.boardTypeDescription !== 'NO ESPECIFICADO' && (
                                <span className="hwiz__room-board">{room.pricing.boardTypeDescription}</span>
                              )}
                              <span className={`hwiz__room-refund hwiz__room-refund--${room.pricing.refundable}`}>
                                {room.pricing.refundable === 'full' ? 'Reembolsable' : room.pricing.refundable === 'partial' ? 'Cancelación parcial' : 'No reembolsable'}
                              </span>
                            </div>
                            <div className="hwiz__room-qty">
                              <button type="button" className="hwiz__qty-btn" onClick={() => decrementRoom(i)} disabled={qty === 0}>−</button>
                              <span className="hwiz__qty-value">{qty}</span>
                              <button type="button" className="hwiz__qty-btn" onClick={() => incrementRoom(i)}>+</button>
                            </div>
                          </>
                        ) : (
                          <div className="hwiz__room-unavailable">No disponible</div>
                        )}
                      </div>
                    </div>
                  </div>
                );})}
              </div>
            )}

            <label className="hwiz__manual-toggle">
              <input type="checkbox" checked={manualMode} onChange={(e) => {
                setManualMode(e.target.checked);
                if (e.target.checked && manualRooms.length === 0) {
                  addManualRoom();
                }
                setRoomQuantities({});
              }} />
              No hay disponibilidad / Modo manual
            </label>

            {/* Manual rooms form */}
            {manualMode && (
              <div className="hwiz__manual-rooms">
                {manualRooms.map((r, i) => {
                  const subtotal = r.pricePerNight * r.nights;
                  const iva = Math.round(subtotal * 0.19);
                  const total = subtotal + iva;
                  return (
                  <div key={i} className="hwiz__manual-room-row">
                    <div className="form-group">
                      <label className="form-label">Habitación</label>
                      <input className="form-input" placeholder="Ej: Doble Standard" value={r.roomName} onChange={(e) => updateManualRoom(i, 'roomName', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Precio/noche</label>
                      <input className="form-input" type="number" min="0" value={r.pricePerNight || ''} onChange={(e) => updateManualRoom(i, 'pricePerNight', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Noches</label>
                      <input className="form-input" type="number" min="1" value={r.nights} onChange={(e) => updateManualRoom(i, 'nights', parseInt(e.target.value, 10) || 1)} />
                    </div>
                    <div className="hwiz__manual-room-total">
                      <div>{formatCOP(subtotal)}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>IVA 19%: {formatCOP(iva)}</div>
                      <div style={{ fontWeight: 'var(--font-bold)' }}>Total: {formatCOP(total)}</div>
                    </div>
                    <button type="button" className="btn btn--danger btn--sm" onClick={() => removeManualRoom(i)} title="Eliminar">×</button>
                  </div>
                );})}
                <button type="button" className="hwiz__add-manual-room" onClick={addManualRoom}>
                  + Agregar habitación
                </button>
              </div>
            )}

            <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
              <label className="form-label">Cuenta bancaria para transferencia *</label>
              <select className="form-input" value={bankKey} onChange={(e) => setBankKey(e.target.value)}>
                <option value="">Selecciona una cuenta</option>
                {Object.entries(BANK_ACCOUNTS).map(([key, { label, accounts }]) => (
                  <option key={key} value={key}>
                    {label} — {accounts.map((a) => `${a.banco}: ${a.numero}`).join(' / ')}
                  </option>
                ))}
              </select>
              {bankKey && BANK_ACCOUNTS[bankKey] && (
                <div className="hwiz__bank-preview">
                  {BANK_ACCOUNTS[bankKey].accounts.map((a, i) => (
                    <div key={i} className="hwiz__bank-item">
                      <strong>{a.banco}</strong>
                      <span>Titular: {a.titular}</span>
                      <span>{a.tipo} Nº {a.numero}</span>
                      {a.nit && <span>NIT: {a.nit}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Responsable a cargo (firma) *</label>
              <select className="form-input" value={responsableKey} onChange={(e) => setResponsableKey(e.target.value)}>
                <option value="">Selecciona un responsable</option>
                {Object.entries(RESPONSABLES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              {responsableKey && RESPONSABLES[responsableKey] && (
                <div className="hwiz__signature-preview">
                  {RESPONSABLES[responsableKey].signatureUrl ? (
                    <img
                      className="hwiz__signature-image"
                      src={RESPONSABLES[responsableKey].signatureUrl}
                      alt={RESPONSABLES[responsableKey].label}
                    />
                  ) : (
                    <span className="hwiz__signature-missing">Sin firma cargada</span>
                  )}
                  <strong>{RESPONSABLES[responsableKey].label}</strong>
                </div>
              )}
            </div>

            <div className="hwiz__footer">
              <button className="btn btn--secondary" onClick={() => { setStep(2); setAvailability(null); setRoomQuantities({}); setManualRooms([]); }}>← Atrás</button>
              <button className="btn btn--primary" onClick={confirmar} disabled={!canConfirm}>
                {submitting ? 'Creando...' : `Confirmar ${confirmCount} habitación${confirmCount !== 1 ? 'es' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
