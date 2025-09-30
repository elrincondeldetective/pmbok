// frontend/src/context/ProcessContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import type { AnyProcess, IPMBOKProcess, IScrumProcess, ITTOItem, Country } from '../types/process';
import { v4 as uuidv4 } from 'uuid';

const ensureIds = (items: ITTOItem[]): ITTOItem[] => {
    return items.map(item => ({
        ...item,
        id: item.id || uuidv4(),
        isActive: item.isActive ?? false,
        versions: item.versions ? ensureIds(item.versions) : [],
    }));
};

interface ProcessContextType {
    processes: AnyProcess[];
    loading: boolean;
    error: string | null;
    selectedCountry: Country | null;
    setSelectedCountry: (country: Country | null) => void;
    updateProcessInState: (processId: number, processType: 'pmbok' | 'scrum', updatedProcessData: Partial<AnyProcess>) => void;
}

export const ProcessContext = createContext<ProcessContextType>({
    processes: [],
    loading: true,
    error: null,
    selectedCountry: null,
    setSelectedCountry: () => {},
    updateProcessInState: () => {},
});

export const ProcessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [processes, setProcesses] = useState<AnyProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const [selectedCountry, setSelectedCountryState] = useState<Country | null>(() => {
        const savedCountry = localStorage.getItem('selectedCountry');
        return savedCountry ? JSON.parse(savedCountry) : null;
    });

    // Carga los datos base una sola vez al montar el componente
    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken && location.pathname !== '/login' && location.pathname !== '/register') return;

        const controller = new AbortController();
        const fetchBaseData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Se obtienen los datos base de PMBOK y Scrum, incluyendo todas las personalizaciones existentes.
                // La API ya fusiona la personalización relevante si se pasa el `country` param.
                // Para la carga inicial, no pasamos país, obtenemos los datos "por defecto".
                const [pmbokResponse, scrumResponse] = await Promise.all([
                    apiClient.get<IPMBOKProcess[]>('/pmbok-processes/', { signal: controller.signal }),
                    apiClient.get<IScrumProcess[]>('/scrum-processes/', { signal: controller.signal })
                ]);
                
                const pmbokData = pmbokResponse.data.map(p => ({ ...p, type: 'pmbok' as const, inputs: ensureIds(p.inputs), tools_and_techniques: ensureIds(p.tools_and_techniques), outputs: ensureIds(p.outputs) }));
                const scrumData = scrumResponse.data.map(p => ({ ...p, type: 'scrum' as const, inputs: ensureIds(p.inputs), tools_and_techniques: ensureIds(p.tools_and_techniques), outputs: ensureIds(p.outputs) }));

                setProcesses([...pmbokData, ...scrumData]);
                setInitialLoadComplete(true);
            } catch (err: any) {
                if (err.name !== 'CanceledError') {
                    setError("Error al cargar datos base. Por favor, recarga la página.");
                    console.error("Error fetching base processes:", err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchBaseData();
        return () => { controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Esta función se mantiene por si se necesita en el futuro, pero ya no se llama automáticamente.
    const fetchAndMergeCountryData = useCallback(async (country: Country) => {
        const controller = new AbortController();
        try {
            const params = { country: country.code };
            const [pmbokResponse, scrumResponse] = await Promise.all([
                apiClient.get<IPMBOKProcess[]>('/pmbok-processes/', { signal: controller.signal, params }),
                apiClient.get<IScrumProcess[]>('/scrum-processes/', { signal: controller.signal, params })
            ]);

            const countryProcesses = [
                ...pmbokResponse.data.map(p => ({ ...p, type: 'pmbok' as const })),
                ...scrumResponse.data.map(p => ({ ...p, type: 'scrum' as const }))
            ];

            setProcesses(prevProcesses => {
                const processesMap = new Map(prevProcesses.map(p => [`${p.type}-${p.id}`, p]));
                
                countryProcesses.forEach(countryProcess => {
                    if (countryProcess.customization) {
                        const key = `${countryProcess.type}-${countryProcess.id}`;
                        processesMap.set(key, {
                            ...countryProcess,
                            inputs: ensureIds(countryProcess.inputs),
                            tools_and_techniques: ensureIds(countryProcess.tools_and_techniques),
                            outputs: ensureIds(countryProcess.outputs),
                        });
                    }
                });

                return Array.from(processesMap.values());
            });
        } catch (err: any) {
            if (err.name !== 'CanceledError') {
                console.error(`Failed to fetch data for ${country.code}`, err);
            }
        }
        return () => { controller.abort(); };
    }, []);

    // ❌ BLOQUE ELIMINADO ❌
    // Se elimina el efecto que reaccionaba al cambio de `selectedCountry`.
    // Esto evita que el filtro global recargue y modifique los datos de toda la aplicación.
    // useEffect(() => {
    //     if (initialLoadComplete && selectedCountry) {
    //         fetchAndMergeCountryData(selectedCountry);
    //     }
    // }, [selectedCountry, initialLoadComplete, fetchAndMergeCountryData]);

    const setSelectedCountry = (country: Country | null) => {
        setSelectedCountryState(country);
        if (country) {
            localStorage.setItem('selectedCountry', JSON.stringify(country));
        } else {
            localStorage.removeItem('selectedCountry');
        }
    };

    const updateProcessInState = (processId: number, processType: 'pmbok' | 'scrum', updatedProcessData: Partial<AnyProcess>) => {
        setProcesses(prevProcesses =>
            prevProcesses.map(p =>
                (p.id === processId && p.type === processType) ? { ...p, ...updatedProcessData } : p
            )
        );
    };

    return (
        <ProcessContext.Provider value={{ processes, loading, error, selectedCountry, setSelectedCountry, updateProcessInState }}>
            {children}
        </ProcessContext.Provider>
    );
};

