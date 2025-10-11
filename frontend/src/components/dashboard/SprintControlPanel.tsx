// frontend/src/components/dashboard/SprintControlPanel.tsx
import React, { useState, useContext, useMemo } from 'react';
import { FaPlay, FaSync, FaChevronRight, FaLock } from 'react-icons/fa';
import { ProcessContext } from '../../context/ProcessContext';
import apiClient from '../../api/apiClient';

// --- LÓGICA DE FLUJO HÍBRIDO ---
const workflowStages = [
    { 
        name: "Estrategia (PMBOK)", 
        action: "Activar Fase Estratégica", 
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
    const { processes, updateProcessInState } = useContext(ProcessContext);
    const [sprintNumber, setSprintNumber] = useState(1);
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

    const prerequisiteMet = useMemo(() => {
        if (currentStageIndex === 0) return true;

        const prevStage = workflowStages[currentStageIndex - 1];
        if (!prevStage) return true;

        const prereqProcesses = processes.filter(p => p.status?.name === prevStage.statusToActivate);
        
        if (prereqProcesses.length === 0) return true;
        
        return prereqProcesses.every(p => p.kanban_status === 'done');
    }, [currentStageIndex, processes]);

    const handleActivateStage = async () => {
        const stage = workflowStages[currentStageIndex];
        setIsLoading(true);
        setFeedback(null);

        // ===== CAMBIO 2 de 2: LÓGICA CONDICIONAL PARA EL ESTADO KANBAN =====
        // El primer paso (índice 0) mueve a 'backlog' (Pendiente).
        // Los pasos siguientes mueven a 'todo' (Por Hacer).
        const targetKanbanStatus = currentStageIndex === 0 ? 'backlog' : 'todo';
        const targetKanbanLabel = targetKanbanStatus === 'backlog' ? 'Pendiente' : 'Por Hacer';
        // ===================================================================

        if (!prerequisiteMet) {
            setFeedback({ message: `Completa todas las tareas de la etapa anterior ("${workflowStages[currentStageIndex-1].name}") para continuar.`, type: 'error' });
            setIsLoading(false);
            setTimeout(() => setFeedback(null), 5000);
            return;
        }

        const processesToActivate = processes.filter(p => {
            const typeMatch = stage.processType === 'both' || p.type === stage.processType;
            return typeMatch && p.status?.name === stage.statusToActivate && (p.kanban_status === 'unassigned' || p.kanban_status === 'backlog');
        });

        if (processesToActivate.length === 0) {
            setFeedback({ message: `No hay nuevas tareas para la etapa "${stage.name}". Avanzando...`, type: 'info' });
            setCurrentStageIndex((prev) => prev + 1);
            setIsLoading(false);
            return;
        }

        const pmbokIds = processesToActivate.filter(p => p.type === 'pmbok').map(p => p.id);
        const scrumIds = processesToActivate.filter(p => p.type === 'scrum').map(p => p.id);
        
        // Optimistic UI update
        processesToActivate.forEach(proc => {
            updateProcessInState(proc.id, proc.type, { ...proc, kanban_status: targetKanbanStatus });
        });

        try {
            const apiCalls = [];
            if (pmbokIds.length > 0) {
                apiCalls.push(apiClient.post('/pmbok-processes/bulk-update-kanban-status/', { process_ids: pmbokIds, kanban_status: targetKanbanStatus }));
            }
            if (scrumIds.length > 0) {
                apiCalls.push(apiClient.post('/scrum-processes/bulk-update-kanban-status/', { process_ids: scrumIds, kanban_status: targetKanbanStatus }));
            }
            
            await Promise.all(apiCalls);

            setFeedback({ message: `${processesToActivate.length} tarea(s) movida(s) a "${targetKanbanLabel}".`, type: 'success' });
            setCurrentStageIndex((prev) => prev + 1);

        } catch (error) {
            console.error("Error al activar la etapa:", error);
            setFeedback({ message: "Error al actualizar las tareas. Reintentando...", type: 'error' });
            // Revertir
            processesToActivate.forEach(proc => {
                updateProcessInState(proc.id, proc.type, { ...proc });
            });
        } finally {
            setIsLoading(false);
            setTimeout(() => setFeedback(null), 4000);
        }
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
