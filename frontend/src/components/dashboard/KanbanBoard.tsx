// frontend/src/components/dashboard/KanbanBoard.tsx
import React, { useState, useEffect } from 'react';
import type { IProcess } from '../../types/process';
import apiClient from '../../api/apiClient';

// Definimos los tipos para las columnas y su configuración
type KanbanStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

interface ColumnConfig {
    title: string;
    color: string;
}

const columnConfig: Record<KanbanStatus, ColumnConfig> = {
    backlog: { title: 'Pendiente (Backlog)', color: 'border-t-gray-400' },
    todo: { title: 'Por Hacer (To Do)', color: 'border-t-blue-500' },
    in_progress: { title: 'En Progreso (In Progress)', color: 'border-t-yellow-500' },
    in_review: { title: 'En Revisión (In Review)', color: 'border-t-purple-500' },
    done: { title: 'Hecho (Done)', color: 'border-t-green-500' },
};

const columnOrder: KanbanStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];

interface KanbanBoardProps {
    initialProcesses: IProcess[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ initialProcesses }) => {
    const [columns, setColumns] = useState<Record<KanbanStatus, IProcess[]>>({
        backlog: [], todo: [], in_progress: [], in_review: [], done: []
    });

    // Efecto para organizar los procesos en columnas cuando cambian los props iniciales
    useEffect(() => {
        const newColumns: Record<KanbanStatus, IProcess[]> = {
            backlog: [], todo: [], in_progress: [], in_review: [], done: []
        };
        initialProcesses.forEach(process => {
            if (newColumns[process.kanban_status]) {
                newColumns[process.kanban_status].push(process);
            }
        });
        setColumns(newColumns);
    }, [initialProcesses]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, processId: number, fromColumn: KanbanStatus) => {
        e.dataTransfer.setData('processId', processId.toString());
        e.dataTransfer.setData('fromColumn', fromColumn);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necesario para permitir el drop
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, toColumn: KanbanStatus) => {
        e.preventDefault();
        const processId = Number(e.dataTransfer.getData('processId'));
        const fromColumn = e.dataTransfer.getData('fromColumn') as KanbanStatus;

        if (processId && fromColumn !== toColumn) {
            const processToMove = columns[fromColumn].find(p => p.id === processId);

            if (processToMove) {
                // Optimistic UI Update
                const newSourceColumn = columns[fromColumn].filter(p => p.id !== processId);
                const newDestColumn = [...columns[toColumn], { ...processToMove, kanban_status: toColumn }];

                setColumns(prev => ({
                    ...prev,
                    [fromColumn]: newSourceColumn,
                    [toColumn]: newDestColumn,
                }));

                // API Call
                try {
                    await apiClient.patch(`/pmbok-processes/${processId}/update-kanban-status/`, {
                        kanban_status: toColumn
                    });
                } catch (error) {
                    console.error("Error al actualizar el estado del proceso:", error);
                    // Revertir el cambio si la API falla
                    setColumns(prev => {
                        // Volvemos a buscar el proceso en la columna de destino
                        const revertedDestColumn = prev[toColumn].filter(p => p.id !== processId);
                        // Lo devolvemos a la columna original
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {columnOrder.map(columnKey => (
                    <div
                        key={columnKey}
                        className="bg-gray-100 rounded-lg p-4 flex flex-col"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, columnKey)}
                    >
                        <h3 className={`font-bold text-gray-700 pb-3 mb-3 border-b-4 ${columnConfig[columnKey].color}`}>
                            {columnConfig[columnKey].title}
                            <span className="ml-2 bg-gray-300 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">{columns[columnKey]?.length || 0}</span>
                        </h3>
                        <div className="space-y-3 flex-grow min-h-48">
                            {columns[columnKey]?.map(process => (
                                <div
                                    key={process.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, process.id, columnKey)}
                                    className="bg-white p-3 rounded-md shadow hover:shadow-lg cursor-grab active:cursor-grabbing border-l-4"
                                    style={{ borderColor: process.status?.tailwind_bg_color.startsWith('bg-') ? `var(--color-${process.status.tailwind_bg_color.substring(3)})` : '#ccc' }}
                                >
                                    <p className="text-sm font-semibold text-gray-800">{process.process_number}. {process.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
             {/* Hack para asegurar que los colores de Tailwind estén disponibles para style binding */}
            <span className="hidden border-t-gray-400 border-t-blue-500 border-t-yellow-500 border-t-purple-500 border-t-green-500"></span>
        </div>
    );
};

export default KanbanBoard;
