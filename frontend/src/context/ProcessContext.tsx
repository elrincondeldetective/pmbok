// frontend/src/context/ProcessContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
import type { AnyProcess, IPMBOKProcess, IScrumProcess } from '../types/process';

interface ProcessContextType {
    processes: AnyProcess[];
    loading: boolean;
    error: string | null;
    updateProcessInState: (processId: number, processType: 'pmbok' | 'scrum', updatedProcessData: Partial<AnyProcess>) => void;
}

export const ProcessContext = createContext<ProcessContextType>({
    processes: [],
    loading: true,
    error: null,
    updateProcessInState: () => {},
});

export const ProcessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const location = useLocation();
    const [processes, setProcesses] = useState<AnyProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            setLoading(false);
            setProcesses([]);
            setError(null);
            return;
        }

        const controller = new AbortController();

        const fetchAllProcesses = async () => {
            setLoading(true);
            setError(null);

            try {
                // Hacemos ambas peticiones en paralelo
                const [pmbokResponse, scrumResponse] = await Promise.all([
                    apiClient.get<IPMBOKProcess[]>('/pmbok-processes/', { signal: controller.signal }),
                    apiClient.get<IScrumProcess[]>('/scrum-processes/', { signal: controller.signal })
                ]);

                // Añadimos el campo 'type' para poder diferenciarlos fácilmente
                const pmbokData = pmbokResponse.data.map(p => ({ ...p, type: 'pmbok' as const }));
                const scrumData = scrumResponse.data.map(p => ({ ...p, type: 'scrum' as const }));

                // Combinamos y guardamos en el estado
                setProcesses([...pmbokData, ...scrumData]);

            } catch (err: any) {
                if (err.name === 'CanceledError') {
                    console.log('Request canceled:', err.message);
                } else {
                    console.error("Error fetching processes:", err);
                    setError("Tu sesión puede haber expirado o hay un problema de red. Por favor, intenta iniciar sesión de nuevo.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchAllProcesses();

        return () => {
            controller.abort();
        };
    }, [location.pathname]);

    const updateProcessInState = (processId: number, processType: 'pmbok' | 'scrum', updatedProcessData: Partial<AnyProcess>) => {
        setProcesses(prevProcesses =>
            prevProcesses.map(p =>
                (p.id === processId && p.type === processType) ? { ...p, ...updatedProcessData } : p
            )
        );
    };

    return (
        <ProcessContext.Provider value={{ processes, loading, error, updateProcessInState }}>
            {children}
        </ProcessContext.Provider>
    );
};
