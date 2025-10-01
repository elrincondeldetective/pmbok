// frontend/src/context/ProcessContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
// ===== INICIO: CAMBIO - IMPORTAR NUEVOS TIPOS =====
import type {
    AnyProcess,
    IPMBOKProcess,
    IScrumProcess,
    ITTOItem,
    Country,
    IProcessCustomization,
    KanbanStatus,
    IDepartment // <-- Añadido
} from '../types/process';
// ===== FIN: CAMBIO =====
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
    // ===== INICIO: CAMBIO - AÑADIR DEPARTAMENTOS AL CONTEXTO =====
    departments: IDepartment[];
    // ===== FIN: CAMBIO =====
    loading: boolean;
    error: string | null;
    selectedCountry: Country | null;
    setSelectedCountry: (country: Country | null) => void;
    updateProcessInState: (processId: number, processType: 'pmbok' | 'scrum', updatedProcessData: Partial<AnyProcess>) => void;
    addOrUpdateCustomization: (processId: number, processType: 'pmbok' | 'scrum', customization: IProcessCustomization) => void;
    updateCustomizationStatus: (processId: number, processType: 'pmbok' | 'scrum', customizationId: number, newStatus: KanbanStatus) => void;
}

// Creación del contexto con valores por defecto
export const ProcessContext = createContext<ProcessContextType>({
    processes: [],
    // ===== INICIO: CAMBIO - VALOR POR DEFECTO PARA DEPARTAMENTOS =====
    departments: [],
    // ===== FIN: CAMBIO =====
    loading: true,
    error: null,
    selectedCountry: null,
    setSelectedCountry: () => {},
    updateProcessInState: () => {},
    addOrUpdateCustomization: () => {},
    updateCustomizationStatus: () => {},
});

// Proveedor del contexto que envolverá la aplicación
export const ProcessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [processes, setProcesses] = useState<AnyProcess[]>([]);
    // ===== INICIO: CAMBIO - AÑADIR ESTADO PARA DEPARTAMENTOS =====
    const [departments, setDepartments] = useState<IDepartment[]>([]);
    // ===== FIN: CAMBIO =====
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
            // ===== INICIO: CAMBIO - AÑADIR PETICIÓN PARA OBTENER DEPARTAMENTOS =====
            const [pmbokResponse, scrumResponse, departmentsResponse] = await Promise.all([
                apiClient.get<IPMBOKProcess[]>('/pmbok-processes/', { signal: controller.signal }),
                apiClient.get<IScrumProcess[]>('/scrum-processes/', { signal: controller.signal }),
                apiClient.get<IDepartment[]>('/departments/', { signal: controller.signal })
            ]);
            // ===== FIN: CAMBIO =====

            const pmbokData = pmbokResponse.data.map(p => ({ ...p, type: 'pmbok' as const, inputs: ensureIds(p.inputs), tools_and_techniques: ensureIds(p.tools_and_techniques), outputs: ensureIds(p.outputs) }));
            const scrumData = scrumResponse.data.map(p => ({ ...p, type: 'scrum' as const, inputs: ensureIds(p.inputs), tools_and_techniques: ensureIds(p.tools_and_techniques), outputs: ensureIds(p.outputs) }));

            setProcesses([...pmbokData, ...scrumData]);
            // ===== INICIO: CAMBIO - GUARDAR DEPARTAMENTOS EN EL ESTADO =====
            setDepartments(departmentsResponse.data);
            // ===== FIN: CAMBIO =====

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
    
    const addOrUpdateCustomization = (processId: number, processType: 'pmbok' | 'scrum', customization: IProcessCustomization) => {
        setProcesses(prevProcesses =>
            prevProcesses.map(p => {
                if (p.id === processId && p.type === processType) {
                    const updatedProcess = { ...p, customizations: [...p.customizations] };
                    
                    const existingIndex = updatedProcess.customizations.findIndex(
                        c => c.country_code === customization.country_code
                    );

                    if (existingIndex !== -1) {
                        updatedProcess.customizations[existingIndex] = customization;
                    } else {
                        updatedProcess.customizations.push(customization);
                    }
                    return updatedProcess;
                }
                return p;
            })
        );
    };

    const updateCustomizationStatus = (processId: number, processType: 'pmbok' | 'scrum', customizationId: number, newStatus: KanbanStatus) => {
        setProcesses(prevProcesses =>
            prevProcesses.map(p => {
                if (p.id === processId && p.type === processType) {
                    const updatedCustomizations = p.customizations.map(cust =>
                        cust.id === customizationId ? { ...cust, kanban_status: newStatus } : cust
                    );
                    return { ...p, customizations: updatedCustomizations };
                }
                return p;
            })
        );
    };

    return (
        <ProcessContext.Provider value={{
            processes,
            // ===== INICIO: CAMBIO - PROVEER DEPARTAMENTOS AL CONTEXTO =====
            departments,
            // ===== FIN: CAMBIO =====
            loading,
            error,
            selectedCountry,
            setSelectedCountry,
            updateProcessInState,
            addOrUpdateCustomization,
            updateCustomizationStatus
        }}>
            {children}
        </ProcessContext.Provider>
    );
};
