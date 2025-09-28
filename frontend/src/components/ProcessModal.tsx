// frontend/src/components/ProcessModal.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '/src/api/apiClient';
import type { KanbanStatus, IPMBOKProcess } from '/src/types/process';
import { ProcessContext } from '/src/context/ProcessContext';

const kanbanStatusOptions: { value: KanbanStatus; label: string }[] = [
    { value: 'unassigned', label: 'No Asignado' },
    { value: 'backlog', label: 'Pendiente' },
    { value: 'todo', label: 'Por Hacer' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'in_review', label: 'En Revisión' },
    { value: 'done', label: 'Hecho' },
];


const ProcessModal: React.FC = () => {
    const { processId } = useParams<{ processId: string }>();
    const navigate = useNavigate();
    const [process, setProcess] = useState<IPMBOKProcess | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { updateProcessInState } = useContext(ProcessContext);

    useEffect(() => {
        if (!processId) return;

        const controller = new AbortController();
        const fetchProcess = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get<IPMBOKProcess>(`/pmbok-processes/${processId}/`, {
                    signal: controller.signal
                });
                setProcess({...response.data, type: 'pmbok'});
            } catch (err: any) {
                if (err.name !== 'CanceledError') {
                    console.error("Failed to fetch process details:", err);
                    setError('No se pudo cargar el detalle del proceso. Inténtalo de nuevo.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProcess();
        return () => controller.abort();
    }, [processId]);
    
    const handleKanbanStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as KanbanStatus;
        if (!process) return;

        const oldProcess = { ...process };
        setProcess({ ...process, kanban_status: newStatus });

        try {
            const response = await apiClient.patch<IPMBOKProcess>(`/pmbok-processes/${processId}/update-kanban-status/`, {
                kanban_status: newStatus
            });
            updateProcessInState(response.data.id, 'pmbok', {...response.data, type: 'pmbok'});
            setProcess({...response.data, type: 'pmbok'});
        } catch (error) {
            console.error("Error al actualizar el estado Kanban:", error);
            setProcess(oldProcess);
            alert("No se pudo actualizar el estado. Por favor, inténtalo de nuevo.");
        }
    };


    const handleClose = () => {
        navigate(-1);
    };

    const renderList = (title: string, items: string | undefined) => {
        if (!items) return null;
        return (
            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600 bg-gray-50 p-4 rounded-md border border-gray-200">
                    {items.split('\n').map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
                </ul>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 flex justify-center items-center p-4 animate-fade-in"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-transform duration-300 scale-95 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {loading && (
                    <div className="flex items-center justify-center h-48">
                        <p className="text-gray-600">Cargando detalles del proceso...</p>
                    </div>
                )}
                {error && (
                    <div className="flex flex-col items-center justify-center h-48 p-8">
                        <p className="text-red-600 font-semibold">{error}</p>
                        <button onClick={handleClose} className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md">Cerrar</button>
                    </div>
                )}

                {process && (
                    <>
                        <div className={`p-6 rounded-t-xl ${process.status?.tailwind_bg_color || 'bg-gray-700'} ${process.status?.tailwind_text_color || 'text-white'}`}>
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-grow">
                                    <h2 className="text-2xl font-bold">{process.process_number}. {process.name}</h2>
                                    {/* ===== INICIO: CAMBIO SOLICITADO ===== */}
                                    {/* Se añade un indicador visual para el modal. */}
                                    <div className="mt-2">
                                        <span className="inline-block bg-white/25 text-white/95 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                            PMBOK® 6
                                        </span>
                                    </div>
                                    {/* ===== FIN: CAMBIO SOLICITADO ===== */}
                                    {process.stage && <p className={`text-sm opacity-90 mt-2`}>{process.stage.name}</p>}
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-4">
                                    <select
                                        value={process.kanban_status}
                                        onChange={handleKanbanStatusChange}
                                        className="bg-white/20 text-white text-sm font-semibold rounded-md p-2 border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                                        onClick={(e) => e.stopPropagation()} // Evita cerrar el modal al hacer clic
                                    >
                                        {kanbanStatusOptions.map(option => (
                                            <option key={option.value} value={option.value} className="text-black">
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <button onClick={handleClose} className="text-2xl font-bold hover:opacity-75 transition-opacity" aria-label="Cerrar modal">
                                        &times;
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Resumen del Proceso (PMBOK® 6)</h3>
                                <p className="text-gray-600 bg-blue-50 p-4 rounded-md border-l-4 border-blue-400">
                                    Este proceso documenta formalmente el proyecto, vinculando el trabajo a los objetivos estratégicos de la organización. El <strong>{process.outputs.split('\n')[0].toLowerCase()}</strong> resultante otorga al director del proyecto la autoridad para aplicar los recursos de la organización a las actividades del proyecto.
                                </p>
                            </div>
                            {renderList('Entradas', process.inputs)}
                            {renderList('Herramientas y Técnicas', process.tools_and_techniques)}
                            {renderList('Salidas', process.outputs)}
                        </div>

                        <div className="p-4 bg-gray-100 rounded-b-xl border-t text-right">
                            <button onClick={handleClose} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-md hover:bg-gray-700 transition duration-300">
                                Cerrar
                            </button>
                        </div>
                    </>
                )}
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ProcessModal;

