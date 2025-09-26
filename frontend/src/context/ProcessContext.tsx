// frontend/src/context/ProcessContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const [processes, setProcesses] = useState<IProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchProcesses = async () => {
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