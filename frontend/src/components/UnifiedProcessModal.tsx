// frontend/src/components/UnifiedProcessModal.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useMatch } from 'react-router-dom';
import apiClient from '../api/apiClient.ts';
import type { AnyProcess, KanbanStatus, IPMBOKProcess, IScrumProcess } from '../types/process.ts';
import { ProcessContext } from '../context/ProcessContext.tsx';
import { FaSignInAlt, FaTools, FaSignOutAlt, FaPencilAlt, FaPlus, FaTimes, FaEye, FaInfoCircle } from 'react-icons/fa';

// --- Constantes y componentes compartidos ---
const kanbanStatusOptions: { value: KanbanStatus; label: string }[] = [
    { value: 'unassigned', label: 'No Asignado' },
    { value: 'backlog', label: 'Pendiente' },
    { value: 'todo', label: 'Por Hacer' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'in_review', label: 'En Revisión' },
    { value: 'done', label: 'Hecho' },
];

const ActionIcons: React.FC = () => (
    <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-80 transition-opacity duration-300">
        <FaPencilAlt className="w-3.5 h-3.5 text-yellow-600 cursor-pointer hover:text-yellow-500" title="Editar" />
        <FaPlus className="w-3.5 h-3.5 text-green-600 cursor-pointer hover:text-green-500" title="Añadir" />
        <FaTimes className="w-3.5 h-3.5 text-red-600 cursor-pointer hover:text-red-500" title="Eliminar" />
        <FaEye className="w-3.5 h-3.5 text-blue-600 cursor-pointer hover:text-blue-500" title="Ver" />
    </div>
);

const UnifiedProcessModal: React.FC = () => {
    const { processId } = useParams<{ processId: string }>();
    const navigate = useNavigate();
    // Determina el tipo de proceso basándose en la ruta actual
    const isPmbokRoute = useMatch("/process/:processId");
    const { updateProcessInState } = useContext(ProcessContext);

    const [process, setProcess] = useState<AnyProcess | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Define el tipo de proceso y el endpoint de la API dinámicamente
    const processType = isPmbokRoute ? 'pmbok' : 'scrum';
    const apiEndpoint = processType === 'pmbok' ? 'pmbok-processes' : 'scrum-processes';

    useEffect(() => {
        if (!processId) return;

        const controller = new AbortController();
        const fetchProcess = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get<IPMBOKProcess | IScrumProcess>(`/${apiEndpoint}/${processId}/`, {
                    signal: controller.signal
                });
                // Añadimos la propiedad 'type' para usarla en la renderización condicional
                setProcess({ ...response.data, type: processType });
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
    }, [processId, apiEndpoint, processType]);

    const handleKanbanStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as KanbanStatus;
        if (!process) return;

        const oldProcess = { ...process };
        setProcess({ ...process, kanban_status: newStatus }); // Actualización optimista

        try {
            const response = await apiClient.patch<AnyProcess>(`/${apiEndpoint}/${processId}/update-kanban-status/`, {
                kanban_status: newStatus
            });
            const updatedData = { ...response.data, type: processType };
            updateProcessInState(response.data.id, processType, updatedData);
            setProcess(updatedData);
        } catch (error) {
            console.error("Error al actualizar el estado Kanban:", error);
            setProcess(oldProcess); // Revertir en caso de error
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
                        <li key={index} className="group flex items-center justify-between py-2.5 border-b border-gray-200/80 last:border-b-0">
                            <span className="flex-grow pr-4 text-sm">
                                {process?.type === 'scrum' ? item.trim().replace(/\*$/, '') : item.trim()}
                                {process?.type === 'scrum' && item.endsWith('*') && <span className="text-blue-500 font-semibold ml-1" title="Elemento clave">*</span>}
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

    const renderContent = () => {
        if (loading) return <div className="flex items-center justify-center h-48"><p className="text-gray-600">Cargando detalles del proceso...</p></div>;
        if (error) return (
            <div className="flex flex-col items-center justify-center h-48 p-8">
                <p className="text-red-600 font-semibold">{error}</p>
                <button onClick={handleClose} className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md">Cerrar</button>
            </div>
        );
        if (!process) return null;

        const isPmbok = process.type === 'pmbok';
        const group = isPmbok ? (process as IPMBOKProcess).stage : (process as IScrumProcess).phase;
        const frameworkName = isPmbok ? 'PMBOK® 6' : 'SCRUM GUIDE';

        return (
            <>
                <div className={`p-6 rounded-t-xl ${process.status?.tailwind_bg_color || 'bg-gray-700'} ${process.status?.tailwind_text_color || 'text-white'}`}>
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-grow">
                            <h2 className="text-2xl font-bold">{process.process_number}. {process.name}</h2>
                            <div className="mt-2 flex items-center gap-4">
                                <span className="inline-block bg-white/25 text-white/95 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                    {frameworkName}
                                </span>
                                {group && <p className={`text-sm opacity-90`}>{group.name}</p>}
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
                            <button onClick={handleClose} className="text-2xl font-bold hover:opacity-75 transition-opacity" aria-label="Cerrar modal">
                                &times;
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto space-y-8 bg-gray-50">
                    <div>
                        <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-3">
                            <FaInfoCircle className="text-gray-500"/>
                            <span className="ml-2">Resumen del Proceso ({frameworkName})</span>
                        </h3>
                        {isPmbok ? (
                             <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400 shadow-sm text-sm">
                                Este proceso documenta formalmente el proyecto, vinculando el trabajo a los objetivos estratégicos de la organización. El <strong>{process.outputs.split('\n')[0].trim().toLowerCase()}</strong> resultante otorga al director del proyecto la autoridad para aplicar los recursos de la organización a las actividades del proyecto.
                            </p>
                        ) : (
                            <p className="text-gray-700 bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400 shadow-sm text-sm">
                                Este proceso es parte del marco de trabajo Scrum, diseñado para entregar valor en ciclos cortos e iterativos. Se enfoca en la <strong>colaboración, adaptación e inspección continua</strong> para lograr los objetivos del proyecto de manera eficiente.
                            </p>
                        )}
                    </div>
                    {renderList('Entradas', process.inputs, <FaSignInAlt className="text-blue-500"/>)}
                    {renderList('Herramientas y Técnicas', process.tools_and_techniques, <FaTools className="text-amber-500"/>)}
                    {renderList('Salidas', process.outputs, <FaSignOutAlt className="text-green-500"/>)}
                </div>

                <div className="p-4 bg-gray-100 rounded-b-xl border-t text-right">
                    <button onClick={handleClose} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-md hover:bg-gray-700 transition duration-300">
                        Cerrar
                    </button>
                </div>
            </>
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
                {renderContent()}
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default UnifiedProcessModal;