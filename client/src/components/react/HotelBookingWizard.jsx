import { useState, useEffect } from 'react';
import './HotelBookingWizard.css';
import { getHotelImageUrl } from '../../lib/hotelImages.js';
import { getRoomImageUrl } from '../../lib/roomImages.js';

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

function nightsLabel(checkin, checkout) {
  if (!checkin || !checkout) return '';
  const diff = Math.round((new Date(checkout) - new Date(checkin)) / 86400000);
  return diff > 0 ? `${diff} noche${diff !== 1 ? 's' : ''}` : '';
}

function HotelPreview({ hotelId, hotelName, city, compact = false }) {
  const imageUrl = getHotelImageUrl(hotelId, hotelName);
  if (!hotelId || !hotelName) return null;

  return (
    <div className={`hwiz__hotel-preview${compact ? ' hwiz__hotel-preview--compact' : ''}`}>
      {imageUrl ? (
        <img
          className="hwiz__hotel-image"
          src={imageUrl}
          alt={hotelName}
          loading="lazy"
        />
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

export default function HotelBookingWizard({ onConfirm, onCancel }) {
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
  const [selectedRoom, setSelectedRoom] = useState(null);
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

  async function buscarDisponibilidad() {
    setError('');
    setAvailability(null);
    setSelectedRoom(null);
    if (!hotelId || !checkin || !checkout) {
      setError('Completa hotel, fecha de entrada y fecha de salida.');
      return;
    }
    if (checkin < todayYMD()) {
      setError('La fecha de entrada no puede ser anterior a hoy.');
      return;
    }
    const nights = Math.round((new Date(checkout) - new Date(checkin)) / 86400000);
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

  function confirmar() {
    if (!selectedRoom) return;
    const nights = availability.nights;
    const item = {
      name: `${hotelName} — ${selectedRoom.roomName} (${nights} noche${nights !== 1 ? 's' : ''})`,
      qty: 1,
      unitPrice: selectedRoom.pricing.amountBeforeTax,
      discount: 0,
      subtotal: selectedRoom.pricing.amountBeforeTax,
      booking: {
        city,
        hotelId,
        hotelName,
        roomId: selectedRoom.roomId,
        roomName: selectedRoom.roomName,
        checkin: availability.checkin,
        checkout: availability.checkout,
        nights,
        adults: availability.adults,
        childrenAges: availability.childrenAges,
        boardTypeDescription: selectedRoom.pricing.boardTypeDescription,
        refundable: selectedRoom.pricing.refundable,
        cancellationPolicy: selectedRoom.pricing.cancellationPolicy,
        currency: selectedRoom.pricing.currency,
        trm: selectedRoom.pricing.trm,
      },
    };
    onConfirm(item);
  }

  return (
    <div className="hwiz-overlay">
      <div className="hwiz-backdrop" onClick={onCancel} />
      <div className="hwiz card">
        <div className="hwiz__header">
          <h2 className="hwiz__title">
            {step === 1 && 'Seleccionar hotel'}
            {step === 2 && 'Fechas y huéspedes'}
            {step === 3 && 'Habitaciones disponibles'}
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
                  className="form-input"
                  type="date"
                  value={checkin}
                  min={todayYMD()}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCheckin(value);
                    if (checkout && value && checkout <= value) setCheckout('');
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Check-out *</label>
                <input
                  className="form-input"
                  type="date"
                  value={checkout}
                  min={checkin ? addDaysYMD(checkin, 1) : todayYMD()}
                  onChange={(e) => setCheckout(e.target.value)}
                />
              </div>
            </div>
            {nightsLabel(checkin, checkout) && (
              <p className="hwiz__nights-label">{nightsLabel(checkin, checkout)}</p>
            )}
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
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        max="17"
                        value={age}
                        onChange={(e) => handleChildAgeChange(i, e.target.value)}
                      />
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

        {/* STEP 3 — Selección de habitación */}
        {step === 3 && availability && (
          <div className="hwiz__body">
            <HotelPreview hotelId={hotelId} hotelName={hotelName} city={city} compact />
            {error && <p className="form-error hwiz__error">{error}</p>}
            <p className="hwiz__availability-summary">
              {hotelName} · {availability.nights} noche{availability.nights !== 1 ? 's' : ''} · {availability.adults} adulto{availability.adults !== 1 ? 's' : ''}
              {availability.childrenAges.length > 0 && ` · ${availability.childrenAges.length} menor${availability.childrenAges.length !== 1 ? 'es' : ''}`}
            </p>
            <div className="hwiz__rooms">
              {availability.rooms.map((room, i) => {
                const roomImageUrl = getRoomImageUrl(hotelId, room.roomId);
                return (
                <button
                  key={`${room.roomId}-${i}`}
                  className={`hwiz__room-card${selectedRoom === room ? ' hwiz__room-card--selected' : ''}${!room.available ? ' hwiz__room-card--unavailable' : ''}`}
                  onClick={() => room.available && setSelectedRoom(room)}
                  disabled={!room.available}
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
                        </>
                      ) : (
                        <div className="hwiz__room-unavailable">No disponible</div>
                      )}
                    </div>
                  </div>
                </button>
              );})}
            </div>
            <div className="hwiz__footer">
              <button className="btn btn--secondary" onClick={() => { setStep(2); setAvailability(null); setSelectedRoom(null); }}>← Atrás</button>
              <button className="btn btn--primary" onClick={confirmar} disabled={!selectedRoom}>
                Confirmar reserva
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
