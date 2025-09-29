// frontend/src/hooks/useProcessData.ts
import { useState, useEffect, useContext } from 'react';
import { useParams, useMatch } from 'react-router-dom';
import apiClient from '../api/apiClient';
import type { AnyProcess, IPMBOKProcess, IScrumProcess } from '../types/process';
import { ProcessContext } from '../context/ProcessContext';

/**
 * Hook personalizado para obtener los datos de un proceso específico.
 * Abstrae la lógica de determinar el tipo de proceso (PMBOK/Scrum),
 * buscarlo en el contexto global o hacer una llamada a la API si no se encuentra.
 * @returns {object} El estado del proceso, carga y error.
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
            // 1. Intentar encontrar el proceso en el estado global primero
            const existingProcess = processes.find(p => p.id === parseInt(processId) && p.type === processType);

            if (existingProcess) {
                setProcess(existingProcess);
                setLoading(false);
            } else {
                // 2. Si no está en el estado global, obtenerlo de la API
                setLoading(true);
                try {
                    const response = await apiClient.get<IPMBOKProcess | IScrumProcess>(`/${apiEndpoint}/${processId}/`);
                    setProcess({ ...response.data, type: processType });
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

