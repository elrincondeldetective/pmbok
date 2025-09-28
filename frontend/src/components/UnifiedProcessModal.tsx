// frontend/src/components/UnifiedProcessModal.tsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useMatch } from 'react-router-dom';
import apiClient from '../api/apiClient.ts';
import type { AnyProcess, KanbanStatus, IPMBOKProcess, IScrumProcess, ITTOItem } from '../types/process.ts';
import { ProcessContext } from '../context/ProcessContext.tsx';
import { FaSignInAlt, FaTools, FaSignOutAlt, FaPencilAlt, FaPlus, FaTimes, FaEye, FaInfoCircle, FaLink } from 'react-icons/fa';

const kanbanStatusOptions: { value: KanbanStatus; label: string }[] = [
    { value: 'unassigned', label: 'No Asignado' },
    { value: 'backlog', label: 'Pendiente' },
    { value: 'todo', label: 'Por Hacer' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'in_review', label: 'En Revisión' },
    { value: 'done', label: 'Hecho' },
];

interface ActionIconsProps {
    onEdit: () => void;
    onAdd: () => void;
}

// --- CAMBIO: Se añade un manejador de evento al icono '+' para evitar que el click se propague ---
const ActionIcons: React.FC<ActionIconsProps> = ({ onEdit, onAdd }) => (
    <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-80 transition-opacity duration-300">
        <FaPencilAlt onClick={onEdit} className="w-3.5 h-3.5 text-yellow-600 cursor-pointer hover:text-yellow-500" title="Editar" />
        <FaPlus onClick={(e) => { e.stopPropagation(); e.preventDefault(); onAdd(); }} className="w-3.5 h-3.5 text-green-600 cursor-pointer hover:text-green-500" title="Añadir" />
        <FaTimes className="w-3.5 h-3.5 text-red-600 cursor-pointer hover:text-red-500" title="Eliminar" />
        <FaEye className="w-3.5 h-3.5 text-blue-600 cursor-pointer hover:text-blue-500" title="Ver" />
    </div>
);

const UnifiedProcessModal: React.FC = () => {
    const { processId } = useParams<{ processId: string }>();
    const navigate = useNavigate();
    const isPmbokRoute = useMatch("/process/:processId");
    const { updateProcessInState, processes } = useContext(ProcessContext);

    const [process, setProcess] = useState<AnyProcess | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- CAMBIO 1: El estado de edición ahora incluye un flag para identificar si es un item nuevo. ---
    const [editingState, setEditingState] = useState<{ id: string | null; name: string; url: string; isNew?: boolean }>({
        id: null,
        name: '',
        url: '',
        isNew: false,
    });

    const processType = isPmbokRoute ? 'pmbok' : 'scrum';
    const apiEndpoint = processType === 'pmbok' ? 'pmbok-processes' : 'scrum-processes';

    useEffect(() => {
        if (!processId) return;

        // Busca primero en el estado del contexto para una carga más rápida
        const existingProcess = processes.find(p => p.id === parseInt(processId) && p.type === processType);
        if (existingProcess) {
            setProcess(existingProcess);
            setLoading(false);
        } else {
            // Si no está en el contexto, lo busca en la API
            const controller = new AbortController();
            const fetchProcess = async () => {
                setLoading(true);
                try {
                    const response = await apiClient.get<IPMBOKProcess | IScrumProcess>(`/${apiEndpoint}/${processId}/`, {
                        signal: controller.signal
                    });
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
        }
    }, [processId, apiEndpoint, processType, processes]);

    // --- CAMBIO 2: Nueva función para manejar la adición de un item. ---
    const handleAddItem = (listKey: 'inputs' | 'tools_and_techniques' | 'outputs', listTitle: 'Entradas' | 'Herramientas y Técnicas' | 'Salidas') => {
        if (!process) return;

        const newItem: ITTOItem = { name: 'Nuevo documento', url: '' };

        const updatedItems = [...process[listKey], newItem];
        const updatedProcess = { ...process, [listKey]: updatedItems };
        setProcess(updatedProcess);

        setEditingState({
            id: `${listTitle}-${updatedItems.length - 1}`,
            name: newItem.name,
            url: newItem.url,
            isNew: true
        });
    };

    const handleKanbanStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as KanbanStatus;
        if (!process) return;

        const oldProcess = { ...process };
        const updatedProcessPreview = { ...process, kanban_status: newStatus };
        setProcess(updatedProcessPreview);
        updateProcessInState(process.id, process.type, updatedProcessPreview);

        try {
            await apiClient.patch(`/${apiEndpoint}/${processId}/update-kanban-status/`, {
                kanban_status: newStatus
            });
        } catch (error) {
            console.error("Error al actualizar el estado Kanban:", error);
            setProcess(oldProcess);
            updateProcessInState(process.id, process.type, oldProcess);
            alert("No se pudo actualizar el estado. Por favor, inténtalo de nuevo.");
        }
    };

    const handleClose = () => navigate(-1);

    const handleSaveEdit = async () => {
        if (!process || !editingState.id) return;

        const [listTitle, indexStr] = editingState.id.split(/-(?=\d+$)/);
        const index = parseInt(indexStr, 10);

        const propertyMap = {
            'Entradas': 'inputs',
            'Herramientas y Técnicas': 'tools_and_techniques',
            'Salidas': 'outputs'
        } as const;

        const processKey = propertyMap[listTitle as keyof typeof propertyMap];
        if (!processKey) return;

        const oldProcess = { ...process };

        const originalItem = process[processKey][index];
        const wasKeyElement = process.type === 'scrum' && originalItem?.name.trim().endsWith('*');

        const newName = wasKeyElement
            ? `${editingState.name.trim()}*`
            : editingState.name.trim();

        const updatedItems = [...process[processKey]];
        updatedItems[index] = { name: newName, url: editingState.url };

        const updatedProcess = { ...process, [processKey]: updatedItems };

        setProcess(updatedProcess);
        updateProcessInState(process.id, process.type, updatedProcess);
        handleCancelEdit();

        try {
            await apiClient.patch(`/${apiEndpoint}/${process.id}/update-ittos/`, {
                [processKey]: updatedItems
            });
        } catch (error) {
            console.error(`Error al guardar los cambios para ${processKey}:`, error);
            setProcess(oldProcess);
            updateProcessInState(oldProcess.id, oldProcess.type, oldProcess);
            alert('No se pudieron guardar los cambios. Inténtalo de nuevo.');
        }
    };

    // --- CAMBIO 3: Se actualiza la función de cancelar para manejar los items nuevos. ---
    const handleCancelEdit = () => {
        if (editingState.isNew && process && editingState.id) {
            const [listTitle] = editingState.id.split(/-(?=\d+$)/);
            const propertyMap = {
                'Entradas': 'inputs', 'Herramientas y Técnicas': 'tools_and_techniques', 'Salidas': 'outputs'
            } as const;
            const processKey = propertyMap[listTitle as keyof typeof propertyMap];
            if (processKey) {
                const updatedItems = process[processKey].slice(0, -1);
                const updatedProcess = { ...process, [processKey]: updatedItems };
                setProcess(updatedProcess);
            }
        }

        setEditingState({ id: null, name: '', url: '', isNew: false });
    };

    const renderList = (title: 'Entradas' | 'Herramientas y Técnicas' | 'Salidas', items: ITTOItem[] | undefined, icon: React.ReactNode) => {
        if (!items) return null;

        const propertyMap = {
            'Entradas': 'inputs',
            'Herramientas y Técnicas': 'tools_and_techniques',
            'Salidas': 'outputs'
        } as const;

        const processKey = propertyMap[title as keyof typeof propertyMap];

        return (
            <div>
                <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-3">
                    {icon}
                    <span className="ml-2">{title}</span>
                </h3>
                <ul className="text-gray-700 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    {items.map((item, index) => {
                        const itemId = `${title}-${index}`;
                        const isEditing = editingState.id === itemId;
                        const isKeyElement = process?.type === 'scrum' && item.name.trim().endsWith('*');
                        const cleanName = item.name.replace(/\*$/, '').trim();

                        return (
                            <li key={index} className="group flex items-center justify-between py-2.5 border-b border-gray-200/80 last:border-b-0">
                                {isEditing ? (
                                    <div className="w-full py-1">
                                        <input
                                            type="text"
                                            value={editingState.name}
                                            onChange={(e) => setEditingState({ ...editingState, name: e.target.value })}
                                            className="w-full p-2 border border-blue-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="mt-2 p-3 bg-gray-100 rounded-md border animate-fade-in-down">
                                            <label className="text-xs font-semibold text-gray-500 block mb-1">URL del Documento (Opcional)</label>
                                            <input
                                                type="text"
                                                placeholder="https://ejemplo.com/documento"
                                                value={editingState.url}
                                                onChange={(e) => setEditingState({ ...editingState, url: e.target.value })}
                                                className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <div className="flex items-center justify-end space-x-3 mt-3">
                                            <button onClick={handleCancelEdit} className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md">Cancelar</button>
                                            <button onClick={handleSaveEdit} className="text-sm bg-blue-600 text-white font-bold px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors">Guardar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="flex-grow pr-4 text-sm flex items-center">
                                            {item.url ? (
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline hover:text-blue-800 flex items-center" onClick={e => e.stopPropagation()}>
                                                    {cleanName}
                                                    <FaLink className="w-3 h-3 ml-2 opacity-60" />
                                                </a>
                                            ) : (
                                                cleanName
                                            )}
                                            {isKeyElement && <span className="text-blue-500 font-semibold ml-1" title="Elemento clave">*</span>}
                                        </span>
                                        <div className="flex-shrink-0">
                                            {/* --- CAMBIO 4: Se pasa el 'title' para poder construir el ID del nuevo item. --- */}
                                            <ActionIcons
                                                onEdit={() => setEditingState({ id: itemId, name: cleanName, url: item.url, isNew: false })}
                                                onAdd={() => handleAddItem(processKey, title)}
                                            />
                                        </div>
                                    </>
                                )}
                            </li>
                        );
                    })}
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
                            <FaInfoCircle className="text-gray-500" />
                            <span className="ml-2">Resumen del Proceso ({frameworkName})</span>
                        </h3>
                        {isPmbok ? (
                            <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400 shadow-sm text-sm">
                                Este proceso documenta formalmente el proyecto. El <strong>{(process as IPMBOKProcess).outputs[0]?.name.toLowerCase() || 'resultado'}</strong> resultante otorga la autoridad para aplicar recursos.
                            </p>
                        ) : (
                            <p className="text-gray-700 bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400 shadow-sm text-sm">
                                Este proceso es parte del marco de trabajo Scrum, enfocado en la <strong>colaboración, adaptación e inspección continua</strong> para entregar valor.
                            </p>
                        )}
                    </div>
                    {renderList('Entradas', process.inputs, <FaSignInAlt className="text-blue-500" />)}
                    {renderList('Herramientas y Técnicas', process.tools_and_techniques, <FaTools className="text-amber-500" />)}
                    {renderList('Salidas', process.outputs, <FaSignOutAlt className="text-green-500" />)}
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
        
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
      `}</style>
        </div>
    );
};

export default UnifiedProcessModal;
