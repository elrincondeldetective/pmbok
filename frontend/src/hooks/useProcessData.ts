// /webapps/erd-ecosystem/apps/pmbok/frontend/src/hooks/useProcessData.ts
import { useState, useEffect, useContext } from 'react';
import { useParams, useMatch, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
import type { AnyProcess, IPMBOKProcess, IScrumProcess } from '../types/process';
import { ProcessContext } from '../context/ProcessContext';
import { mergeProcessData } from '../utils/processHelpers';

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

        const processLogic = async () => {
            // Encuentra la versión más reciente de los datos del proceso desde el contexto global
            const baseProcessFromContext = processes.find(p => p.id === parseInt(processId) && p.type === processType);

            // ===== CAMBIO CLAVE: MANTENER EL PAÍS SELECCIONADO =====
            // Prioridad 1: El país que ya está activo en el estado del modal (si 'process' ya existe).
            // Prioridad 2: El país con el que se abrió el modal (desde location.state).
            const activeCountryCode = process?.activeCustomization?.country_code || location.state?.countryCode;

            if (baseProcessFromContext) {
                // Si los datos ya existen en el contexto, simplemente sincronizamos la vista usando el helper.
                // Esto evita el parpadeo de "Cargando...".
                const processToShow = mergeProcessData(baseProcessFromContext, activeCountryCode);
                setProcess(processToShow);
                setLoading(false);
            } else {
                // Si es la primera vez que se abre el modal, buscamos los datos en la API.
                setLoading(true);
                setError(null);
                try {
                    const response = await apiClient.get<IPMBOKProcess | IScrumProcess>(`/${apiEndpoint}/${processId}/`);
                    // CORRECCIÓN: Se añade aserción de tipo para resolver el conflicto.
                    const baseProcessData = { ...response.data, type: processType } as AnyProcess;

                    // Usamos el helper externo para aplicar la lógica de fusión
                    const processToShow = mergeProcessData(baseProcessData, activeCountryCode);
                    setProcess(processToShow);
                } catch (err: any) {
                    console.error("Failed to fetch process details:", err);
                    setError('No se pudo cargar el detalle del proceso. Inténtalo de nuevo.');
                } finally {
                    setLoading(false);
                }
            }
        };

        processLogic();
        // Dependemos de `processes` para que este efecto se ejecute de nuevo cuando los datos globales cambien.
        // Quitamos 'process' de las dependencias para evitar loops infinitos si el objeto cambia de referencia.
    }, [processId, apiEndpoint, processType, processes, location.state]);

    return { process, setProcess, loading, error, processType, apiEndpoint };
};