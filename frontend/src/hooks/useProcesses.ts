// frontend/src/hooks/useProcesses.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
// CORRECCIÓN: Se cambió 'IProcess' por 'AnyProcess' para que coincida con los nuevos tipos de datos.
import type { AnyProcess } from '../types/process';

export const useProcesses = () => {
    const navigate = useNavigate();
    // CORRECCIÓN: Se cambió 'IProcess[]' por 'AnyProcess[]'
    const [processes, setProcesses] = useState<AnyProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchProcesses = async () => {
            try {
                const response = await apiClient.get('/pmbok-processes/', {
                    signal: controller.signal
                });
                setProcesses(response.data);
            } catch (err: any) {
                if (err.name === 'CanceledError') {
                    console.log('Request canceled:', err.message);
                } else {
                    console.error("Error fetching processes:", err);
                    setError("Tu sesión puede haber expirado o hay un problema de red. Por favor, intenta iniciar sesión de nuevo.");
                    navigate('/login');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchProcesses();

        return () => {
            controller.abort();
        };
    }, [navigate]);

    return { processes, loading, error };
};
