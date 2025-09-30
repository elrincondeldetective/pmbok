// frontend/src/hooks/useProcessData.ts
import { useState, useEffect, useContext } from 'react';
import { useParams, useMatch } from 'react-router-dom';
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
            
            // 1. Intentar encontrar el proceso en el estado global.
            const existingProcess = processes.find(p => p.id === parseInt(processId) && p.type === processType);

            if (existingProcess) {
                setProcess(existingProcess);
                setLoading(false);
            } else {
                // 2. Si no está, obtenerlo de la API. La API ahora devolverá el array de personalizaciones.
                try {
                    // La petición ya no necesita el parámetro `country`.
                    const response = await apiClient.get<IPMBOKProcess | IScrumProcess>(`/${apiEndpoint}/${processId}/`);
                    
                    const finalProcessData = { ...response.data, type: processType };
                    
                    setProcess(finalProcessData);
                } catch (err: any) {
                    console.error("Failed to fetch process details:", err);
                    setError('No se pudo cargar el detalle del proceso. Inténtalo de nuevo.');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchProcess();

    }, [processId, apiEndpoint, processType, processes]);

    return { process, setProcess, loading, error, processType, apiEndpoint };
};
