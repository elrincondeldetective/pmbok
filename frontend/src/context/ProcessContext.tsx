// frontend/src/context/ProcessContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
// 1. Importa 'useLocation' para reaccionar a los cambios de ruta
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
import type { IProcess } from '../types/process';

interface ProcessContextType {
    processes: IProcess[];
    loading: boolean;
    error: string | null;
    updateProcessInState: (processId: number, updatedProcessData: Partial<IProcess>) => void;
}

export const ProcessContext = createContext<ProcessContextType>({
    processes: [],
    loading: true,
    error: null,
    updateProcessInState: () => {},
});

export const ProcessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation(); // 2. Obtén la ubicación actual
    const [processes, setProcesses] = useState<IProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');

        // 3. Si no hay token (estamos en /login o /register), no intentes cargar datos.
        if (!accessToken) {
            setLoading(false);
            setProcesses([]); // Limpia datos de sesiones anteriores
            setError(null);   // Limpia errores anteriores
            return;
        }

        const controller = new AbortController();

        const fetchProcesses = async () => {
            setLoading(true); // Vuelve a poner loading al empezar a cargar
            setError(null);   // Limpia cualquier error previo

            try {
                const response = await apiClient.get<IProcess[]>('/pmbok-processes/', {
                    signal: controller.signal
                });
                setProcesses(response.data);
            } catch (err: any) {
                if (err.name === 'CanceledError') {
                    console.log('Request canceled:', err.message);
                } else {
                    console.error("Error fetching processes:", err);
                    setError("Tu sesión puede haber expirado o hay un problema de red. Por favor, intenta iniciar sesión de nuevo.");
                    // Ya no es necesario navegar aquí, el interceptor de apiClient lo maneja.
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
    // 4. El efecto se volverá a ejecutar cada vez que cambie la ruta de la URL
    }, [location.pathname]);

    const updateProcessInState = (processId: number, updatedProcessData: Partial<IProcess>) => {
        setProcesses(prevProcesses =>
            prevProcesses.map(p =>
                p.id === processId ? { ...p, ...updatedProcessData } : p
            )
        );
    };

    return (
        <ProcessContext.Provider value={{ processes, loading, error, updateProcessInState }}>
            {children}
        </ProcessContext.Provider>
    );
};
