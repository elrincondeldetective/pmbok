import React, { useState, useContext, useMemo } from 'react';
import { FaPlay, FaSync, FaChevronRight, FaLock } from 'react-icons/fa';
import { ProcessContext } from '../../context/ProcessContext';
import apiClient from '../../api/apiClient';
// 1. IMPORTAR TIPO
import type { IProcessCustomization } from '../../types/process';

// --- LÓGICA DE FLUJO HÍBRIDO ---
const workflowStages = [
    { 
        name: "Estrategia (PMBOK)", 
        action: "Activar Base Estratégica", 
        statusToActivate: "Base Estratégica",
        processType: "pmbok",
        prereqStatus: null // Es el primer paso
    },
    { 
        name: "Preparación (Scrum)", 
        action: "Iniciar Preparación Scrum", 
        statusToActivate: "Fase 0: Preparación",
        processType: "scrum",
        prereqStatus: "Base Estratégica"
    },
    { 
        name: "Planificación del Sprint", 
        action: "Iniciar Planificación", 
        statusToActivate: "Ciclo del Sprint",
        processType: "scrum",
        prereqStatus: "Fase 0: Preparación"
    },
    { 
        name: "Ejecución Diaria (Híbrido)", 
        action: "Comenzar Trabajo Diario", 
        statusToActivate: "Ritmo Diario",
        processType: "both", // Afecta a ambos
        prereqStatus: "Ciclo del Sprint"
    },
    { 
        name: "Lanzamiento y Cierre", 
        action: "Iniciar Cierre / Lanzamiento", 
        statusToActivate: "Lanzamiento y Cierre",
        processType: "scrum",
        prereqStatus: "Ritmo Diario"
    },
];

const SprintControlPanel: React.FC = () => {
    // 2. OBTENER DATOS DEL CONTEXTO
    const { processes, updateProcessInState, addOrUpdateCustomization, selectedCountry } = useContext(ProcessContext);
    const [sprintNumber, setSprintNumber] = useState(1);
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

    const prerequisiteMet = useMemo(() => {
        if (currentStageIndex === 0) return true;

        const prevStage = workflowStages[currentStageIndex - 1];
        if (!prevStage) return true;

        // Lógica de prerrequisito mejorada
        const prereqProcesses = processes.filter(p => p.status?.name === prevStage.statusToActivate);
        if (prereqProcesses.length === 0) return true; 

        // Si hay un país seleccionado, chequear el estado de las personalizaciones de ESE país
        if (selectedCountry) {
             const relevantCustomizations = prereqProcesses.map(p => 
                p.customizations.find(c => c.country_code === selectedCountry.code)
            ).filter(Boolean); 

            if (relevantCustomizations.length === 0) return true; 
            
            return relevantCustomizations.every(c => c && c.kanban_status === 'done');
        }

        // Fallback: si no hay país, chequear el estado base
        return prereqProcesses.every(p => p.kanban_status === 'done');
        
    }, [currentStageIndex, processes, selectedCountry]);

    // 3. FUNCIÓN handleActivateStage REESCRITA
    const handleActivateStage = async () => {
        const stage = workflowStages[currentStageIndex];
        setIsLoading(true);
        setFeedback(null);

        const targetKanbanStatus = currentStageIndex === 0 ? 'backlog' : 'todo';
        const targetKanbanLabel = targetKanbanStatus === 'backlog' ? 'Pendiente' : 'Por Hacer';

        // --- INICIO DE LA CORRECCIÓN ---

        // 3a. VALIDAR QUE HAYA UN PAÍS SELECCIONADO
        if (!selectedCountry) {
            setFeedback({ message: `Por favor, selecciona un país en la barra de navegación para activar las tareas.`, type: 'error' });
            setIsLoading(false);
            setTimeout(() => setFeedback(null), 5000);
            return;
        }

        if (!prerequisiteMet) {
            setFeedback({ message: `Completa todas las tareas de la etapa anterior ("${workflowStages[currentStageIndex-1].name}") para continuar.`, type: 'error' });
            setIsLoading(false);
            setTimeout(() => setFeedback(null), 5000);
            return;
        }

        // 3b. MODIFICAR EL FILTRO
        const processesToActivate = processes.filter(p => {
            const typeMatch = stage.processType === 'both' || p.type === stage.processType;
            if (!typeMatch || p.status?.name !== stage.statusToActivate) {
                return false;
            }
            // Solo activa si NO tiene ya una personalización para este país
            const hasCustomization = p.customizations.some(c => c.country_code === selectedCountry.code);
            return !hasCustomization;
        });

        if (processesToActivate.length === 0) {
            setFeedback({ message: `No hay nuevas tareas para la etapa "${stage.name}" (o ya están activadas para ${selectedCountry.name}). Avanzando...`, type: 'info' });
            setCurrentStageIndex((prev) => prev + 1);
            setIsLoading(false);
            return;
        }
        
        // 3c. Optimistic UI update: Añade las nuevas personalizaciones al estado
        // Guardar estado original para revertir
        const originalProcesses = processesToActivate.map(proc => 
            processes.find(p => p.id === proc.id && p.type === proc.type)
        );

        processesToActivate.map((proc, index) => {
            const tempCust: IProcessCustomization = {
                id: -(Date.now() + index), // ID temporal negativo
                country_code: selectedCountry.code,
                inputs: proc.inputs,
                tools_and_techniques: proc.tools_and_techniques,
                outputs: proc.outputs,
                kanban_status: targetKanbanStatus, // Estado objetivo
                department: null
            };
            addOrUpdateCustomization(proc.id, proc.type, tempCust);
            return tempCust;
        });

        try {
            // 3d. API Calls: Creamos las nuevas personalizaciones
            const creationPayloads = processesToActivate.map(proc => ({
                process_id: proc.id,
                process_type: proc.type,
                country_code: selectedCountry.code,
                inputs: proc.inputs,
                tools_and_techniques: proc.tools_and_techniques,
                outputs: proc.outputs,
                department_id: null,
            }));

            const creationCalls = creationPayloads.map(payload => 
                apiClient.post<IProcessCustomization>('/customizations/', payload)
            );
            
            const creationResponses = await Promise.all(creationCalls);
            const createdCustomizations = creationResponses.map(res => res.data);

            // 3e. API Calls: Actualizamos el estado Kanban de las personalizaciones recién creadas
            const statusUpdateCalls = createdCustomizations.map(cust => 
                apiClient.patch<IProcessCustomization>(`/customizations/${cust.id}/update-kanban-status/`, {
                    kanban_status: targetKanbanStatus
                })
            );
            
            const statusUpdateResponses = await Promise.all(statusUpdateCalls);
            const updatedCustomizations = statusUpdateResponses.map(res => res.data);

            // 3f. Sincronización final: Actualiza el estado con los datos reales del servidor
            updatedCustomizations.forEach((cust, index) => {
                const proc = processesToActivate[index];
                addOrUpdateCustomization(proc.id, proc.type, cust);
            });

            setFeedback({ message: `${processesToActivate.length} tarea(s) activada(s) para ${selectedCountry.name} y movida(s) a "${targetKanbanLabel}".`, type: 'success' });
            setCurrentStageIndex((prev) => prev + 1);

        } catch (error) {
            console.error("Error al activar la etapa:", error);
            setFeedback({ message: "Error al crear/actualizar las tareas.", type: 'error' });
            
            // 3g. Revertir: Volvemos a poner el estado original
            originalProcesses.forEach(proc => {
                if (proc) {
                    updateProcessInState(proc.id, proc.type, proc);
                }
            });
        } finally {
            setIsLoading(false);
            setTimeout(() => setFeedback(null), 4000);
        }
        // --- FIN DE LA CORRECCIÓN ---
    };

    const handleResetSprint = () => {
        setCurrentStageIndex(0);
        setSprintNumber(prev => prev + 1);
        setFeedback({ message: `¡Listo para iniciar el Sprint ${sprintNumber + 1}!`, type: 'success' });
        setTimeout(() => setFeedback(null), 4000);
    };

    const currentAction = workflowStages[currentStageIndex]?.action || "Ciclo Completado";
    const isCycleComplete = currentStageIndex >= workflowStages.length;

    return (
        <section className="bg-white p-6 rounded-lg shadow-md mb-12">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                    <h2 className="text-xl font-bold text-gray-800">Panel de Control del Flujo Híbrido</h2>
                    <p className="text-gray-600">Sprint Actual: <span className="font-bold text-indigo-600">{sprintNumber}</span></p>
                </div>
                <div className="flex items-center space-x-4">
                    {isCycleComplete ? (
                        <button onClick={handleResetSprint} disabled={isLoading} className="flex items-center bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition duration-300 disabled:bg-gray-400">
                            <FaSync className="mr-2" /> Iniciar Nuevo Sprint
                        </button>
                    ) : (
                        <button onClick={handleActivateStage} disabled={isLoading || !prerequisiteMet} className="flex items-center bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed group relative">
                            {isLoading ? 'Procesando...' : (
                                <>
                                    {prerequisiteMet ? <FaPlay className="mr-2" /> : <FaLock className="mr-2" />}
                                    {currentAction}
                                </>
                            )}
                            {!prerequisiteMet && <span className="absolute -top-10 left-1/2 -translate-x-1/2 w-max bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">Completa la etapa anterior</span>}
                        </button>
                    )}
                </div>
            </div>
            {feedback && <p className={`text-center mt-4 text-sm font-medium animate-fade-in-down ${feedback.type === 'success' ? 'text-green-700' : feedback.type === 'info' ? 'text-blue-700' : 'text-red-700'}`}>{feedback.message}</p>}
             <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500 overflow-x-auto pb-2">
                {workflowStages.map((stage, index) => (
                    <React.Fragment key={stage.name}>
                        <span className={`px-2 py-1 rounded-full whitespace-nowrap ${index < currentStageIndex ? 'bg-green-200 text-green-800' : index === currentStageIndex ? 'bg-blue-200 text-blue-800 animate-pulse' : 'bg-gray-200 text-gray-600'}`}>
                            {stage.name}
                        </span>
                        {index < workflowStages.length - 1 && <FaChevronRight className="text-gray-400 flex-shrink-0"/>}
                    </React.Fragment>
                ))}
            </div>
        </section>
    );
};

export default SprintControlPanel;
