import { useCallback, useEffect, useState } from 'react';
import { api, setApiKey } from '../lib/api.js';

export function useApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  // Un 401 en cualquier llamada descarta la clave guardada y vuelve a pedirla.
  const handleError = useCallback((err, prefix = '') => {
    if (err.status === 401) {
      setApiKey('');
      setUnauthorized(true);
    } else {
      setError(prefix + err.message);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setApplications(await api.list());
      setError(null);
      setUnauthorized(false);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    refresh();
    // Recarga al volver a la pestaña para ver lo que capturó la extensión.
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  const unlock = useCallback(
    (key) => {
      setApiKey(key.trim());
      setLoading(true);
      return refresh();
    },
    [refresh],
  );

  // Actualización optimista: mueve la tarjeta de inmediato y revierte si falla la API.
  const moveApplication = useCallback(
    async (id, status) => {
      let previous;
      setApplications((apps) =>
        apps.map((a) => {
          if (a.id !== id) return a;
          previous = a.status;
          return { ...a, status };
        }),
      );
      if (previous === status) return;
      try {
        await api.update(id, { status });
      } catch (err) {
        setApplications((apps) => apps.map((a) => (a.id === id ? { ...a, status: previous } : a)));
        handleError(err, 'No se pudo mover la tarjeta: ');
      }
    },
    [handleError],
  );

  const addApplication = useCallback(async (data) => {
    const created = await api.create(data);
    setApplications((apps) => [created, ...apps]);
    return created;
  }, []);

  const deleteApplication = useCallback(async (id) => {
    await api.remove(id);
    setApplications((apps) => apps.filter((a) => a.id !== id));
  }, []);

  return {
    applications,
    loading,
    error,
    setError,
    unauthorized,
    unlock,
    moveApplication,
    addApplication,
    deleteApplication,
  };
}
