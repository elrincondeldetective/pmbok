// frontend/src/hooks/useProcessData.ts
import { useState, useEffect, useContext } from 'react';
import { useParams, useMatch, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
import type { AnyProcess, IPMBOKProcess, IScrumProcess } from '../types/process';
import { ProcessContext } from '../context/ProcessContext';

/**
 * Hook personalizado para obtener los datos de un proceso específico.
 * Ahora siempre obtiene el proceso con todas sus personalizaciones y el modal
 * se encarga de mostrar la información relevante.
 */
export const useProcessData = () => {
    const { processId } = useParams<{ processId: string }>();
    const isPmbokRoute = useMatch("/process/:processId");
    const location = useLocation();
    const { processes } = useContext(ProcessContext);

    const [process, setProcess] = useState<AnyProcess | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const processType = isPmbokRoute ? 'pmbok' : 'scrum';
    const apiEndpoint = processType === 'pmbok' ? 'pmbok-processes' : 'scrum-processes';

    useEffect(() => {
        if (!processId) return;

        const fetchProcess = async () => {
            setLoading(true);
            setError(null);
            
            // --- INICIO: Lógica para aplicar la personalización de país ---
            const applyCountryCustomization = (baseProcess: AnyProcess): AnyProcess => {
                // Obtiene el countryCode pasado en el estado de la navegación desde el tablero Kanban.
                const countryCode = location.state?.countryCode;

                if (countryCode && baseProcess.customizations) {
                    const customization = baseProcess.customizations.find(c => c.country_code.toLowerCase() === countryCode.toLowerCase());

                    if (customization) {
                        // Si se encuentra una personalización, se sobreescriben los ITTOs base
                        // con los del país y se marca cuál es la personalización activa.
                        return {
                            ...baseProcess,
                            inputs: customization.inputs,
                            tools_and_techniques: customization.tools_and_techniques,
                            outputs: customization.outputs,
                            activeCustomization: customization,
                        };
                    }
                }
                // Si no hay countryCode o no se encuentra personalización, devuelve el proceso base.
                return baseProcess;
            };
            // --- FIN: Lógica para aplicar la personalización de país ---

            // 1. Intentar encontrar el proceso en el estado global del contexto.
            const existingProcess = processes.find(p => p.id === parseInt(processId) && p.type === processType);

            if (existingProcess) {
                // Si se encuentra, aplicar la personalización según el país del Kanban.
                const processWithCountry = applyCountryCustomization(existingProcess);
                setProcess(processWithCountry);
                setLoading(false);
            } else {
                // 2. Si no está, obtenerlo de la API. La API devolverá el array de personalizaciones.
                try {
                    // La petición ya no necesita el parámetro `country`.
                    const response = await apiClient.get<IPMBOKProcess | IScrumProcess>(`/${apiEndpoint}/${processId}/`);
                    
                    // Aplicar la personalización al proceso recién obtenido de la API.
                    const baseProcessData = { ...response.data, type: processType };
                    const processWithCountry = applyCountryCustomization(baseProcessData);
                    setProcess(processWithCountry);
                } catch (err: any) {
                    console.error("Failed to fetch process details:", err);
                    setError('No se pudo cargar el detalle del proceso. Inténtalo de nuevo.');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchProcess();

    }, [processId, apiEndpoint, processType, processes, location.state]);

    return { process, setProcess, loading, error, processType, apiEndpoint };
};