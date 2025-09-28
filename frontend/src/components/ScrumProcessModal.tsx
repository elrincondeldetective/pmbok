// frontend/src/components/ScrumProcessModal.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient.ts';
import type { IScrumProcess, KanbanStatus } from '../types/process.ts';
import { ProcessContext } from '../context/ProcessContext.tsx';
import { FaSignInAlt, FaTools, FaSignOutAlt, FaPencilAlt, FaPlus, FaTimes, FaEye, FaInfoCircle } from 'react-icons/fa';

// --- Opciones para el selector de estado Kanban ---
const kanbanStatusOptions: { value: KanbanStatus; label: string }[] = [
    { value: 'unassigned', label: 'No Asignado' },
    { value: 'backlog', label: 'Pendiente' },
    { value: 'todo', label: 'Por Hacer' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'in_review', label: 'En Revisión' },
    { value: 'done', label: 'Hecho' },
];

// --- Componente de Iconos de Acción ---
const ActionIcons: React.FC = () => {
    return (
        <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-80 transition-opacity duration-300">
            <FaPencilAlt className="w-3.5 h-3.5 text-yellow-600 cursor-pointer hover:text-yellow-500" title="Editar" />
            <FaPlus className="w-3.5 h-3.5 text-green-600 cursor-pointer hover:text-green-500" title="Añadir" />
            <FaTimes className="w-3.5 h-3.5 text-red-600 cursor-pointer hover:text-red-500" title="Eliminar" />
            <FaEye className="w-3.5 h-3.5 text-blue-600 cursor-pointer hover:text-blue-500" title="Ver" />
        </div>
    );
};


const ScrumProcessModal: React.FC = () => {
    const { processId } = useParams<{ processId: string }>();
    const navigate = useNavigate();
    const [process, setProcess] = useState<IScrumProcess | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { updateProcessInState } = useContext(ProcessContext);

    useEffect(() => {
        if (!processId) return;
        const controller = new AbortController();
        const fetchProcess = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get<IScrumProcess>(`/scrum-processes/${processId}/`, {
                    signal: controller.signal
                });
                setProcess({...response.data, type: 'scrum'});
            } catch (err: any) {
                if (err.name !== 'CanceledError') {
                    setError('No se pudo cargar el detalle del proceso de Scrum.');
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
        const updatedProcess = { ...process, kanban_status: newStatus };
        setProcess(updatedProcess); // Actualización optimista

        try {
            const response = await apiClient.patch<IScrumProcess>(`/scrum-processes/${processId}/update-kanban-status/`, {
                kanban_status: newStatus
            });
            updateProcessInState(response.data.id, 'scrum', {...response.data, type: 'scrum'});
            setProcess({...response.data, type: 'scrum'});
        } catch (error) {
            console.error("Error al actualizar el estado Kanban:", error);
            setProcess(oldProcess);
            alert("No se pudo actualizar el estado. Por favor, inténtalo de nuevo.");
        }
    };

    const handleClose = () => navigate(-1);

    const renderList = (title: string, items: string | undefined, icon: React.ReactNode) => {
        if (!items) return null;
        const itemList = items.split('\n').filter(item => item.trim() !== '');
        if (itemList.length === 0) return null;

        return (
            <div>
                 <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-3">
                    {icon}
                    <span className="ml-2">{title}</span>
                </h3>
                <ul className="text-gray-700 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    {itemList.map((item, index) => (
                        <li
                            key={index}
                            className="group flex items-center justify-between py-2.5 border-b border-gray-200/80 last:border-b-0"
                        >
                            <span className="flex-grow pr-4 text-sm">
                                {item.trim().replace(/\*$/, '')}
                                {item.endsWith('*') && <span className="text-blue-500 font-semibold ml-1" title="Elemento clave">*</span>}
                            </span>
                            <div className="flex-shrink-0">
                                <ActionIcons />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 flex justify-center items-center p-4 animate-fade-in"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-transform duration-300 scale-95 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {loading && <div className="flex items-center justify-center h-48"><p>Cargando...</p></div>}
                {error && <div className="flex flex-col items-center justify-center h-48 p-8"><p className="text-red-600">{error}</p><button onClick={handleClose}>Cerrar</button></div>}

                {process && (
                    <>
                        <div className={`p-6 rounded-t-xl ${process.status?.tailwind_bg_color || 'bg-gray-700'} ${process.status?.tailwind_text_color || 'text-white'}`}>
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-grow">
                                    <h2 className="text-2xl font-bold">{process.process_number}. {process.name}</h2>
                                    <div className="mt-2 flex items-center gap-4">
                                        <span className="inline-block bg-white/25 text-white/95 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                            SCRUM GUIDE
                                        </span>
                                        {process.phase && <span className={`text-sm opacity-90`}>{process.phase.name}</span>}
                                    </div>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-4">
                                    <select
                                        value={process.kanban_status}
                                        onChange={handleKanbanStatusChange}
                                        className="bg-white/20 text-white text-sm font-semibold rounded-md p-2 border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {kanbanStatusOptions.map(option => (
                                            <option key={option.value} value={option.value} className="text-black">
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <button onClick={handleClose} className="text-2xl font-bold hover:opacity-75" aria-label="Cerrar modal">&times;</button>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8 bg-gray-50">
                            {/* --- SECCIÓN DE RESUMEN AÑADIDA --- */}
                            <div>
                                <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-3">
                                    <FaInfoCircle className="text-gray-500"/>
                                    <span className="ml-2">Resumen del Proceso (Guía Scrum)</span>
                                </h3>
                                <p className="text-gray-700 bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400 shadow-sm text-sm">
                                    Este proceso es parte del marco de trabajo Scrum, diseñado para entregar valor en ciclos cortos e iterativos. Se enfoca en la <strong>colaboración, adaptación e inspección continua</strong> para lograr los objetivos del proyecto de manera eficiente.
                                </p>
                            </div>

                            {renderList('Entradas', process.inputs, <FaSignInAlt className="text-blue-500"/>)}
                            {renderList('Herramientas y Técnicas', process.tools_and_techniques, <FaTools className="text-amber-500"/>)}
                            {renderList('Salidas', process.outputs, <FaSignOutAlt className="text-green-500"/>)}
                        </div>

                        <div className="p-4 bg-gray-100 rounded-b-xl border-t text-right">
                            <button onClick={handleClose} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-md hover:bg-gray-700">Cerrar</button>
                        </div>
                    </>
                )}
            </div>
            <style>{`.animate-fade-in{animation:fade-in .2s ease-out forwards}@keyframes fade-in{from{opacity:0}to{opacity:1}}.animate-scale-in{animation:scale-in .2s ease-out forwards}@keyframes scale-in{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        </div>
    );
};

export default ScrumProcessModal;

