// frontend/src/context/ProcessContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
import type { AnyProcess, IPMBOKProcess, IScrumProcess, ITTOItem, Country, IProcessCustomization } from '../types/process';
import { v4 as uuidv4 } from 'uuid';

// Helper para asegurar que todos los ITTOs y sus versiones tengan un ID único para React.
const ensureIds = (items: ITTOItem[]): ITTOItem[] => {
    return items.map(item => ({
        ...item,
        id: item.id || uuidv4(),
        isActive: item.isActive ?? false,
        versions: item.versions ? ensureIds(item.versions) : [],
    }));
};

// Definición de la estructura del contexto
interface ProcessContextType {
    processes: AnyProcess[];
    loading: boolean;
    error: string | null;
    selectedCountry: Country | null;
    setSelectedCountry: (country: Country | null) => void;
    updateProcessInState: (processId: number, processType: 'pmbok' | 'scrum', updatedProcessData: Partial<AnyProcess>) => void;
    // ===== INICIO: NUEVA FUNCIÓN AÑADIDA =====
    addOrUpdateCustomization: (processId: number, processType: 'pmbok' | 'scrum', customization: IProcessCustomization) => void;
    // ===== FIN: NUEVA FUNCIÓN AÑADIDA =====
}

// Creación del contexto con valores por defecto
export const ProcessContext = createContext<ProcessContextType>({
    processes: [],
    loading: true,
    error: null,
    selectedCountry: null,
    setSelectedCountry: () => {},
    updateProcessInState: () => {},
    // ===== INICIO: VALOR POR DEFECTO PARA LA NUEVA FUNCIÓN =====
    addOrUpdateCustomization: () => {},
    // ===== FIN: VALOR POR DEFECTO =====
});

// Proveedor del contexto que envolverá la aplicación
export const ProcessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [processes, setProcesses] = useState<AnyProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const location = useLocation();

    // El estado del país seleccionado se inicializa desde localStorage
    const [selectedCountry, setSelectedCountryState] = useState<Country | null>(() => {
        const savedCountry = localStorage.getItem('selectedCountry');
        return savedCountry ? JSON.parse(savedCountry) : null;
    });

    // --- FUNCIÓN DE CARGA DE DATOS UNIFICADA ---
    const loadAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const controller = new AbortController();

        try {
            const [pmbokResponse, scrumResponse] = await Promise.all([
                apiClient.get<IPMBOKProcess[]>('/pmbok-processes/', { signal: controller.signal }),
                apiClient.get<IScrumProcess[]>('/scrum-processes/', { signal: controller.signal })
            ]);

            const pmbokData = pmbokResponse.data.map(p => ({ ...p, type: 'pmbok' as const, inputs: ensureIds(p.inputs), tools_and_techniques: ensureIds(p.tools_and_techniques), outputs: ensureIds(p.outputs) }));
            const scrumData = scrumResponse.data.map(p => ({ ...p, type: 'scrum' as const, inputs: ensureIds(p.inputs), tools_and_techniques: ensureIds(p.tools_and_techniques), outputs: ensureIds(p.outputs) }));

            setProcesses([...pmbokData, ...scrumData]);

        } catch (err: any) {
            if (err.name !== 'CanceledError') {
                setError("Error al cargar datos. Por favor, recarga la página.");
                console.error("Error fetching data:", err);
            }
        } finally {
            setLoading(false);
        }

        return () => { controller.abort(); };
    }, []);


    // --- EFECTO PARA LA CARGA INICIAL ---
    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken && location.pathname !== '/login' && location.pathname !== '/register') return;

        loadAllData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    // Función para actualizar el país global y guardarlo en localStorage
    const setSelectedCountry = (country: Country | null) => {
        setSelectedCountryState(country);
        if (country) {
            localStorage.setItem('selectedCountry', JSON.stringify(country));
        } else {
            localStorage.removeItem('selectedCountry');
        }
    };

    // Función para actualizaciones optimistas de la UI desde otros componentes
    const updateProcessInState = (processId: number, processType: 'pmbok' | 'scrum', updatedProcessData: Partial<AnyProcess>) => {
        setProcesses(prevProcesses =>
            prevProcesses.map(p =>
                (p.id === processId && p.type === processType) ? { ...p, ...updatedProcessData } : p
            )
        );
    };
    
    // ===== INICIO: IMPLEMENTACIÓN DE LA NUEVA FUNCIÓN =====
    /**
     * Busca un proceso por su ID y tipo, y actualiza o añade una personalización a su lista.
     * Esto mantiene el estado global sincronizado con el backend sin necesidad de un refetch.
     */
    const addOrUpdateCustomization = (processId: number, processType: 'pmbok' | 'scrum', customization: IProcessCustomization) => {
        setProcesses(prevProcesses =>
            prevProcesses.map(p => {
                if (p.id === processId && p.type === processType) {
                    // Clonamos el proceso para evitar mutaciones directas
                    const updatedProcess = { ...p, customizations: [...p.customizations] };
                    
                    const existingIndex = updatedProcess.customizations.findIndex(
                        c => c.country_code === customization.country_code
                    );

                    if (existingIndex !== -1) {
                        // Si ya existe una personalización para ese país, la reemplazamos
                        updatedProcess.customizations[existingIndex] = customization;
                    } else {
                        // Si es nueva, la añadimos a la lista
                        updatedProcess.customizations.push(customization);
                    }
                    return updatedProcess;
                }
                return p;
            })
        );
    };
    // ===== FIN: IMPLEMENTACIÓN DE LA NUEVA FUNCIÓN =====

    return (
        <ProcessContext.Provider value={{ processes, loading, error, selectedCountry, setSelectedCountry, updateProcessInState, addOrUpdateCustomization }}>
            {children}
        </ProcessContext.Provider>
    );
};
