// frontend/src/components/dashboard/KanbanBoard.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { IProcess } from '../../types/process';
import apiClient from '../../api/apiClient';

// ... (la configuración de las columnas no cambia) ...
type KanbanStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

interface ColumnConfig {
    title: string;
    label: string;
    color: string;
}

const columnConfig: Record<KanbanStatus, ColumnConfig> = {
    backlog: { title: 'Pendiente', label: '(Backlog)', color: 'border-t-gray-400' },
    todo: { title: 'Por Hacer', label: '(To Do)', color: 'border-t-blue-500' },
    in_progress: { title: 'En Progreso', label: '(In Progress)', color: 'border-t-yellow-500' },
    in_review: { title: 'En Revisión', label: '(In Review)', color: 'border-t-purple-500' },
    done: { title: 'Hecho', label: '(Done)', color: 'border-t-green-500' },
};

const columnOrder: KanbanStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];


interface KanbanBoardProps {
    initialProcesses: IProcess[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ initialProcesses }) => {
    const location = useLocation();
    const [columns, setColumns] = useState<Record<KanbanStatus, IProcess[]>>({
        backlog: [], todo: [], in_progress: [], in_review: [], done: []
    });

    useEffect(() => {
        const newColumns: Record<KanbanStatus, IProcess[]> = {
            backlog: [], todo: [], in_progress: [], in_review: [], done: []
        };
        initialProcesses.forEach(process => {
            // Este `if` ya ignora automáticamente los procesos 'unassigned'
            if (newColumns[process.kanban_status]) {
                newColumns[process.kanban_status].push(process);
            }
        });
        setColumns(newColumns);
    }, [initialProcesses]);

    // 👇 --- CAMBIO 1: AÑADIR LA FUNCIÓN PARA DESASIGNAR ---
    const handleRemoveFromKanban = async (processId: number, currentColumn: KanbanStatus) => {
        try {
            // Actualiza el estado en el backend a 'unassigned'
            await apiClient.patch(`/pmbok-processes/${processId}/update-kanban-status/`, {
                kanban_status: 'unassigned'
            });

            // Elimina la tarjeta de la vista actualizando el estado local
            setColumns(prev => ({
                ...prev,
                [currentColumn]: prev[currentColumn].filter(p => p.id !== processId),
            }));

        } catch (error) {
            console.error("Error al desasignar el proceso:", error);
            // Opcional: Mostrar una notificación de error al usuario
            alert("No se pudo quitar la tarea del tablero. Inténtalo de nuevo.");
        }
    };


    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, processId: number, fromColumn: KanbanStatus) => {
        e.dataTransfer.setData('processId', processId.toString());
        e.dataTransfer.setData('fromColumn', fromColumn);
        e.currentTarget.classList.add('opacity-50');
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('opacity-50');
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, toColumn: KanbanStatus) => {
        e.preventDefault();
        const processId = Number(e.dataTransfer.getData('processId'));
        const fromColumn = e.dataTransfer.getData('fromColumn') as KanbanStatus;

        if (processId && fromColumn !== toColumn) {
            const processToMove = columns[fromColumn].find(p => p.id === processId);

            if (processToMove) {
                const newSourceColumn = columns[fromColumn].filter(p => p.id !== processId);
                const newDestColumn = [...columns[toColumn], { ...processToMove, kanban_status: toColumn }];

                setColumns(prev => ({
                    ...prev,
                    [fromColumn]: newSourceColumn,
                    [toColumn]: newDestColumn,
                }));

                try {
                    await apiClient.patch(`/pmbok-processes/${processId}/update-kanban-status/`, {
                        kanban_status: toColumn
                    });
                } catch (error) {
                    console.error("Error al actualizar el estado del proceso:", error);
                    setColumns(prev => {
                        const revertedDestColumn = prev[toColumn].filter(p => p.id !== processId);
                        const revertedSourceColumn = [...prev[fromColumn], processToMove];
                        return {
                            ...prev,
                            [fromColumn]: revertedSourceColumn,
                            [toColumn]: revertedDestColumn,
                        }
                    });
                }
            }
        }
    };

    return (
        <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {columnOrder.map(columnKey => (
                    <div
                        key={columnKey}
                        className="bg-gray-200/50 rounded-lg p-4 flex flex-col"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, columnKey)}
                    >
                        <div className={`text-center pb-3 mb-3 border-b-4 ${columnConfig[columnKey].color}`}>
                            <h3 className="font-bold text-gray-700">{columnConfig[columnKey].title}</h3>
                            <p className="text-xs text-gray-500">{columnConfig[columnKey].label}</p>
                            <span className="absolute -mt-10 ml-28 bg-gray-300 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">{columns[columnKey]?.length || 0}</span>
                        </div>

                        <div className="space-y-4 flex-grow min-h-48 max-h-[30rem] overflow-y-auto pr-2">
                            {columns[columnKey]?.map(process => (
                                <div key={process.id} className="relative group">
                                    <Link
                                        to={`/process/${process.id}`}
                                        state={{ background: location }}
                                    >
                                        <div
                                            draggable
                                            onDragStart={(e) => {
                                                e.stopPropagation();
                                                handleDragStart(e, process.id, columnKey);
                                            }}
                                            onDragEnd={handleDragEnd}
                                            className="bg-white rounded-lg shadow flex flex-col cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                                        >
                                            <div className={`p-3 rounded-t-lg ${process.status ? `${process.status.tailwind_bg_color} ${process.status.tailwind_text_color}` : 'bg-gray-500 text-white'}`}>
                                                <p className="text-sm font-bold leading-tight truncate" title={process.name}>
                                                    {process.process_number}. {process.name}
                                                </p>
                                            </div>
                                            <div className={`border-t px-3 py-2 rounded-b-lg text-center ${process.stage ? `${process.stage.tailwind_bg_color} ${process.stage.tailwind_text_color}` : 'bg-gray-200 text-gray-700'}`}>
                                                <p className="text-xs font-semibold uppercase tracking-wider truncate" title={process.stage?.name}>
                                                    {process.stage ? process.stage.name.split(' (')[0] : 'Etapa'}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                    {/* 👇 --- CAMBIO 2: AÑADIR EL BOTÓN DE ELIMINAR --- */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleRemoveFromKanban(process.id, columnKey);
                                        }}
                                        className="absolute top-1 right-1 bg-black/10 text-white/70 rounded-full w-6 h-6 flex items-center justify-center text-lg font-bold opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all duration-200"
                                        aria-label="Desasignar del tablero"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KanbanBoard;