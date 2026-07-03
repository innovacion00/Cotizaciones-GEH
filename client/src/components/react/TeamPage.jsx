import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../../lib/api.js';
import { ensureWorkspaceId, getCurrentUser } from '../../lib/auth.js';
import './TeamPage.css';

const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', sales: 'Ventas' };

export default function TeamPage() {
  const [workspaceId, setWorkspaceIdState] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const currentUser = getCurrentUser();

  const loadMembers = useCallback(async (wsId) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/api/v1/workspaces/${wsId}/members`);
      setMembers(data.members || []);
      const self = (data.members || []).find((m) => m.user?._id === currentUser?.id);
      setIsAdmin(self?.role === 'admin');
    } catch (err) {
      setError(err.message || 'Error al cargar el equipo');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const wsId = await ensureWorkspaceId();
      if (cancelled) return;
      if (!wsId) {
        setError('No hay workspace configurado.');
        setLoading(false);
        return;
      }
      setWorkspaceIdState(wsId);
      await loadMembers(wsId);
    })();
    return () => { cancelled = true; };
  }, [loadMembers]);

  async function handleRoleChange(memberId, newRole) {
    setSavingId(memberId);
    try {
      await api.patch(`/api/v1/workspaces/${workspaceId}/members/${memberId}`, { role: newRole });
      await loadMembers(workspaceId);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo cambiar el rol', text: err.message || 'Error desconocido' });
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <p className="team__loading">Cargando equipo...</p>;
  if (error) return <p className="team__error">Error: {error}</p>;

  return (
    <div className="team">
      {!isAdmin && (
        <p className="team__notice">Solo un admin del workspace puede cambiar roles. Puedes ver el equipo, pero no editarlo.</p>
      )}
      <div className="team__list">
        <div className="team__header-row">
          <span>Nombre</span>
          <span>Email</span>
          <span>Rol</span>
        </div>
        {members.map((m) => (
          <div key={m.user._id} className="team__row">
            <div className="team__cell">{m.user.name}</div>
            <div className="team__cell">{m.user.email}</div>
            <div className="team__cell">
              {isAdmin ? (
                <select
                  className="form-input"
                  value={m.role}
                  disabled={savingId === m.user._id}
                  onChange={(e) => handleRoleChange(m.user._id, e.target.value)}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="sales">Ventas</option>
                </select>
              ) : (
                <span className={`badge badge--${m.role}`}>{ROLE_LABELS[m.role] || m.role}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
