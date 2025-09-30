// frontend/src/context/ProcessContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
import type { AnyProcess, IPMBOKProcess, IScrumProcess, ITTOItem, Country } from '../types/process';
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
}

// Creación del contexto con valores por defecto
export const ProcessContext = createContext<ProcessContextType>({
    processes: [],
    loading: true,
    error: null,
    selectedCountry: null,
    setSelectedCountry: () => {},
    updateProcessInState: () => {},
});

// Proveedor del contexto que envolverá la aplicación
export const ProcessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [processes, setProcesses] = useState<AnyProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const location = useLocation();

    // El estado del país seleccionado se inicializa desde localStorage
    const [selectedCountry, setSelectedCountryState] = useState<Country | null>(() => {
        const savedCountry = localStorage.getItem('selectedCountry');
        return savedCountry ? JSON.parse(savedCountry) : null;
    });

	// --- FUNCIÓN DE CARGA DE DATOS UNIFICADA ---
    // Esta función, envuelta en useCallback, es ahora la ÚNICA responsable de pedir datos al backend.
    // Puede recibir un país para obtener los datos ya fusionados.
	const loadAllData = useCallback(async (country: Country | null) => {
		setLoading(true);
		setError(null);
		const controller = new AbortController();

		try {
			// Si se proporciona un país, se añade como parámetro a la petición.
			const params = country ? { country: country.code } : {};

			// Se realizan ambas peticiones en paralelo. El backend se encarga de fusionar
            // los datos base con la personalización del país si se le pasa el parámetro.
			const [pmbokResponse, scrumResponse] = await Promise.all([
				apiClient.get<IPMBOKProcess[]>('/pmbok-processes/', { signal: controller.signal, params }),
				apiClient.get<IScrumProcess[]>('/scrum-processes/', { signal: controller.signal, params })
			]);

            // Se procesan los datos recibidos para añadirles el 'tipo' y asegurar los IDs.
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
			setInitialLoadComplete(true);
		}

		return () => { controller.abort(); };
	}, []);


	// --- EFECTO PARA LA CARGA INICIAL ---
	// Se ejecuta UNA SOLA VEZ al montar el componente.
	// Carga los datos usando el país que esté guardado en localStorage (si existe).
    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken && location.pathname !== '/login' && location.pathname !== '/register') return;

		// El país guardado se lee desde el estado, que a su vez lo lee de localStorage.
		loadAllData(selectedCountry);
	// La dependencia `loadAllData` es estable. Las otras solo validan si la carga debe proceder.
	// eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
	
	// --- EFECTO PARA RECARGA GLOBAL (CUANDO CAMBIA EL PAÍS EN LA NAVBAR) ---
	// Se activa SOLO cuando `selectedCountry` cambia DESPUÉS de la carga inicial.
    useEffect(() => {
		// Si la carga inicial no ha terminado, no hagas nada.
		// Esto previene una doble petición al arrancar la aplicación.
 		if (!initialLoadComplete) {
 			return;
        }
		// Llama a la función de carga con el nuevo país seleccionado en la navbar.
		loadAllData(selectedCountry);
	}, [selectedCountry, initialLoadComplete, loadAllData]);


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

    return (
        <ProcessContext.Provider value={{ processes, loading, error, selectedCountry, setSelectedCountry, updateProcessInState }}>
            {children}
        </ProcessContext.Provider>
    );
};
