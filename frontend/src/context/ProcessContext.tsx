// frontend/src/context/ProcessContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import type { AnyProcess, IPMBOKProcess, IScrumProcess, ITTOItem } from '../types/process';
import { v4 as uuidv4 } from 'uuid'; // Importamos para generar IDs únicos

// --- NUEVA FUNCIÓN HELPER ---
// Se asegura de que cada ITTOItem y sus versiones anidadas tengan un ID único.
// Esto es crucial para que React maneje correctamente el estado y las listas.
const ensureIds = (items: ITTOItem[]): ITTOItem[] => {
    return items.map(item => ({
        ...item,
        id: item.id || uuidv4(),
        versions: item.versions ? ensureIds(item.versions) : [],
    }));
};

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
    const navigate = useNavigate();
    const [processes, setProcesses] = useState<AnyProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            if (location.pathname !== '/login' && location.pathname !== '/register') {
                setLoading(false);
                setProcesses([]);
                setError(null);
            }
            return;
        }

        const controller = new AbortController();

        const fetchAllProcesses = async () => {
            setLoading(true);
            setError(null);

            try {
                const [pmbokResponse, scrumResponse] = await Promise.all([
                    apiClient.get<IPMBOKProcess[]>('/pmbok-processes/', { signal: controller.signal }),
                    apiClient.get<IScrumProcess[]>('/scrum-processes/', { signal: controller.signal })
                ]);

                // --- CAMBIO: Aplicamos la función ensureIds a los datos que llegan de la API ---
                const pmbokData = pmbokResponse.data.map(p => ({
                    ...p,
                    type: 'pmbok' as const,
                    inputs: ensureIds(p.inputs),
                    tools_and_techniques: ensureIds(p.tools_and_techniques),
                    outputs: ensureIds(p.outputs),
                }));
                const scrumData = scrumResponse.data.map(p => ({
                    ...p,
                    type: 'scrum' as const,
                    inputs: ensureIds(p.inputs),
                    tools_and_techniques: ensureIds(p.tools_and_techniques),
                    outputs: ensureIds(p.outputs),
                }));

                setProcesses([...pmbokData, ...scrumData]);

            } catch (err: any) {
                if (err.name === 'CanceledError') {
                    console.log('Request canceled:', err.message);
                } else {
                    console.error("Error fetching processes:", err);
                    setError("Tu sesión ha expirado o hay un problema de red.");
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    navigate('/login');
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
    }, [location.pathname, navigate]);

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
