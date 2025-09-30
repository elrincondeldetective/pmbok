// frontend/src/context/ProcessContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import type { AnyProcess, IPMBOKProcess, IScrumProcess, ITTOItem, Country } from '../types/process';
import { v4 as uuidv4 } from 'uuid';

// --- FUNCIÓN HELPER (SIN CAMBIOS) ---
// Se asegura de que cada ITTOItem y sus versiones tengan un ID único.
const ensureIds = (items: ITTOItem[]): ITTOItem[] => {
    return items.map(item => ({
        ...item,
        id: item.id || uuidv4(),
        isActive: item.isActive ?? false,
        versions: item.versions ? ensureIds(item.versions) : [],
    }));
};

// ===== INICIO: CAMBIO EN LA INTERFAZ DEL CONTEXTO =====
interface ProcessContextType {
    processes: AnyProcess[];
    loading: boolean;
    error: string | null;
    selectedCountry: Country | null; // Estado para el país seleccionado
    setSelectedCountry: (country: Country | null) => void; // Función para cambiar el país
    updateProcessInState: (processId: number, processType: 'pmbok' | 'scrum', updatedProcessData: Partial<AnyProcess>) => void;
}
// ===== FIN: CAMBIO EN LA INTERFAZ DEL CONTEXTO =====

export const ProcessContext = createContext<ProcessContextType>({
    processes: [],
    loading: true,
    error: null,
    // Valores por defecto para el nuevo estado
    selectedCountry: null,
    setSelectedCountry: () => { },
    updateProcessInState: () => { },
});

export const ProcessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [processes, setProcesses] = useState<AnyProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // ===== INICIO: NUEVO ESTADO PARA GESTIONAR EL PAÍS SELECCIONADO =====
    // Se inicializa desde localStorage para persistir la sesión. Si no hay nada, se usa Colombia por defecto.
    const [selectedCountry, setSelectedCountryState] = useState<Country | null>(() => {
        const savedCountry = localStorage.getItem('selectedCountry');
        return savedCountry ? JSON.parse(savedCountry) : { code: 'co', name: 'Colombia' };
    });

    // Función wrapper para actualizar el estado y guardarlo en localStorage.
    const setSelectedCountry = (country: Country | null) => {
        setSelectedCountryState(country);
        if (country) {
            localStorage.setItem('selectedCountry', JSON.stringify(country));
        } else {
            localStorage.removeItem('selectedCountry');
        }
    };
    // ===== FIN: NUEVO ESTADO PARA GESTIONAR EL PAÍS SELECCIONADO =====

    // El useEffect ahora depende de `selectedCountry` para recargar los datos cuando este cambie.
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
                // ===== CAMBIO: Añadir el país como parámetro en la petición a la API =====
                const countryCode = selectedCountry ? selectedCountry.code : undefined;
                const params = countryCode ? { country: countryCode } : {};

                const [pmbokResponse, scrumResponse] = await Promise.all([
                    apiClient.get<IPMBOKProcess[]>('/pmbok-processes/', { signal: controller.signal, params }),
                    apiClient.get<IScrumProcess[]>('/scrum-processes/', { signal: controller.signal, params })
                ]);

                // El backend ya envía los datos fusionados. El frontend solo necesita procesarlos.
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
    }, [location.pathname, navigate, selectedCountry]); // <-- Se añade selectedCountry a las dependencias

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
