import { useState, useEffect } from 'react';
import api from '../../lib/api.js';
import { getHotelImageUrl } from '../../lib/hotelImages.js';
import { getRoomImageUrl } from '../../lib/roomImages.js';
import { withMinDelay } from '../../lib/minDelay.js';
import Loader from './Loader.jsx';
import './CatalogoPage.css';

function groupByCity(hotels) {
  const groups = [];
  const indexByCity = new Map();
  for (const hotel of hotels) {
    if (!indexByCity.has(hotel.city)) {
      indexByCity.set(hotel.city, groups.length);
      groups.push({ city: hotel.city, hotels: [] });
    }
    groups[indexByCity.get(hotel.city)].hotels.push(hotel);
  }
  return groups;
}

function HotelCard({ hotel }) {
  const imageUrl = getHotelImageUrl(hotel.hotelId, hotel.name);
  return (
    <div className="card catalogo__hotel-card">
      {imageUrl ? (
        <img className="catalogo__hotel-image" src={imageUrl} alt={hotel.name} loading="lazy" />
      ) : (
        <div className="catalogo__hotel-image catalogo__hotel-image--placeholder" aria-hidden="true" />
      )}
      <div className="catalogo__hotel-body">
        <p className="catalogo__hotel-name">{hotel.name}</p>
        <span className="badge badge--sales">{hotel.city}</span>

        {hotel.rooms.length === 0 ? (
          <p className="catalogo__rooms-empty">Sin habitaciones registradas</p>
        ) : (
          <ul className="catalogo__room-list">
            {hotel.rooms.map((room, idx) => {
              const roomImageUrl = getRoomImageUrl(hotel.hotelId, room.roomId);
              return (
                <li key={`${hotel.hotelId}-${room.roomId}-${idx}`} className="catalogo__room-item">
                  {roomImageUrl ? (
                    <img className="catalogo__room-image" src={roomImageUrl} alt={room.roomName} loading="lazy" />
                  ) : (
                    <div className="catalogo__room-image catalogo__room-image--placeholder" aria-hidden="true" />
                  )}
                  <span className="catalogo__room-name">{room.roomName}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function CatalogoPage() {
  const [cityGroups, setCityGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await withMinDelay(api.get('/api/v1/hotels/catalog'));
        if (cancelled) return;
        setCityGroups(groupByCity(data.hotels || []));
      } catch (err) {
        if (!cancelled) setError(err.message || 'Error al cargar el catálogo');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader label="Cargando catálogo..." />;
  if (error) return <p className="catalogo__error">Error: {error}</p>;

  return (
    <div className="catalogo">
      {cityGroups.map((group) => (
        <section key={group.city} className="catalogo__section">
          <h2 className="catalogo__section-title">{group.city}</h2>
          <div className="catalogo__grid">
            {group.hotels.map((hotel) => (
              <HotelCard key={hotel.hotelId} hotel={hotel} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
