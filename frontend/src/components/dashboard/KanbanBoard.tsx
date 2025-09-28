// frontend/src/components/dashboard/KanbanBoard.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { AnyProcess, KanbanStatus } from '/src/types/process';
import apiClient from '/src/api/apiClient';
import SectionHeader from '/src/components/common/SectionHeader';

type KanbanColumnStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

interface ColumnConfig {
    title: string;
    label: string;
    color: string;
}

const columnConfig: Record<KanbanColumnStatus, ColumnConfig> = {
    backlog: { title: 'Pendiente', label: '(Backlog)', color: 'border-t-gray-400' },
    todo: { title: 'Por Hacer', label: '(To Do)', color: 'border-t-blue-500' },
    in_progress: { title: 'En Progreso', label: '(In Progress)', color: 'border-t-yellow-500' },
    in_review: { title: 'En Revisión', label: '(In Review)', color: 'border-t-purple-500' },
    done: { title: 'Hecho', label: '(Done)', color: 'border-t-green-500' },
};

const columnOrder: KanbanColumnStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];

interface KanbanBoardProps {
    initialProcesses: AnyProcess[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ initialProcesses }) => {
    const location = useLocation();
    const [columns, setColumns] = useState<Record<KanbanColumnStatus, AnyProcess[]>>({
        backlog: [], todo: [], in_progress: [], in_review: [], done: []
    });

    useEffect(() => {
        const newColumns: Record<KanbanColumnStatus, AnyProcess[]> = {
            backlog: [], todo: [], in_progress: [], in_review: [], done: []
        };
        initialProcesses.forEach(process => {
            if (newColumns[process.kanban_status as KanbanColumnStatus]) {
                newColumns[process.kanban_status as KanbanColumnStatus].push(process);
            }
        });
        setColumns(newColumns);
    }, [initialProcesses]);

    const getApiEndpoint = (processType: 'pmbok' | 'scrum') => {
        return processType === 'pmbok' ? 'pmbok-processes' : 'scrum-processes';
    };

    const handleRemoveFromKanban = async (process: AnyProcess, currentColumn: KanbanColumnStatus) => {
        try {
            const endpoint = getApiEndpoint(process.type);
            await apiClient.patch(`/${endpoint}/${process.id}/update-kanban-status/`, {
                kanban_status: 'unassigned'
            });

            setColumns(prev => ({
                ...prev,
                [currentColumn]: prev[currentColumn].filter(p => p.id !== process.id || p.type !== process.type),
            }));

        } catch (error) {
            console.error("Error al desasignar el proceso:", error);
            alert("No se pudo quitar la tarea del tablero. Inténtalo de nuevo.");
        }
    };


    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, process: AnyProcess, fromColumn: KanbanColumnStatus) => {
        e.dataTransfer.setData('processId', process.id.toString());
        e.dataTransfer.setData('processType', process.type);
        e.dataTransfer.setData('fromColumn', fromColumn);
        e.currentTarget.classList.add('opacity-50');
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('opacity-50');
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, toColumn: KanbanColumnStatus) => {
        e.preventDefault();
        const processId = Number(e.dataTransfer.getData('processId'));
        const processType = e.dataTransfer.getData('processType') as 'pmbok' | 'scrum';
        const fromColumn = e.dataTransfer.getData('fromColumn') as KanbanColumnStatus;

        if (processId && fromColumn !== toColumn) {
            const processToMove = columns[fromColumn].find(p => p.id === processId && p.type === processType);

            if (processToMove) {
                // Optimistic UI update
                const newSourceColumn = columns[fromColumn].filter(p => !(p.id === processId && p.type === processType));
                const newDestColumn = [...columns[toColumn], { ...processToMove, kanban_status: toColumn }];
                setColumns(prev => ({ ...prev, [fromColumn]: newSourceColumn, [toColumn]: newDestColumn }));

                try {
                    const endpoint = getApiEndpoint(processType);
                    await apiClient.patch(`/${endpoint}/${processId}/update-kanban-status/`, {
                        kanban_status: toColumn
                    });
                } catch (error) {
                    console.error("Error al actualizar el estado del proceso:", error);
                    // Revert UI on failure
                    setColumns(prev => {
                        const revertedDestColumn = prev[toColumn].filter(p => !(p.id === processId && p.type === processType));
                        const revertedSourceColumn = [...prev[fromColumn], processToMove];
                        return { ...prev, [fromColumn]: revertedSourceColumn, [toColumn]: revertedDestColumn }
                    });
                }
            }
        }
    };

    return (
        <section>
            <SectionHeader title="Tablero Kanban de Procesos" subtitle="Arrastra y suelta las tarjetas para organizar tu flujo de trabajo." />
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
                            {columns[columnKey]?.map(process => {
                                const group = process.type === 'pmbok' ? process.stage : process.phase;
                                const linkTarget = process.type === 'pmbok' ? `/process/${process.id}` : `/scrum-process/${process.id}`;
                                const borderColor = process.type === 'pmbok' ? 'border-l-blue-500' : 'border-l-green-500';

                                return (
                                <div key={`${process.type}-${process.id}`} className="relative group">
                                    <Link
                                        to={linkTarget}
                                        state={{ background: location }}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, process, columnKey)}
                                        onDragEnd={handleDragEnd}
                                        className={`bg-white rounded-lg shadow flex flex-col cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-l-4 ${borderColor}`}
                                    >
                                        <div className={`p-3 rounded-t-lg text-center ${process.status ? `${process.status.tailwind_bg_color} ${process.status.tailwind_text_color}` : 'bg-gray-500 text-white'}`}>
                                            <p className="text-sm font-bold leading-tight truncate" title={process.name}>
                                                {process.process_number}. {process.name}
                                            </p>
                                            {/* ===== INICIO: CAMBIO SOLICITADO ===== */}
                                            {/* Se añade un indicador visual para diferenciar entre PMBOK y Scrum en el Kanban. */}
                                            <span className="mt-1.5 inline-block bg-white/25 text-white/95 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {process.type === 'pmbok' ? 'PMBOK® 6' : 'SCRUM'}
                                            </span>
                                            {/* ===== FIN: CAMBIO SOLICITADO ===== */}
                                        </div>
                                        <div className={`border-t px-3 py-2 rounded-b-lg text-center ${group ? `${group.tailwind_bg_color} ${group.tailwind_text_color}` : 'bg-gray-200 text-gray-700'}`}>
                                            <p className="text-xs font-semibold uppercase tracking-wider truncate" title={group?.name}>
                                                {group ? group.name.split(' (')[0] : 'Grupo'}
                                            </p>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault(); e.stopPropagation();
                                            handleRemoveFromKanban(process, columnKey);
                                        }}
                                        className="absolute top-1 right-1 bg-black/10 text-white/70 rounded-full w-6 h-6 flex items-center justify-center text-lg font-bold opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all duration-200"
                                        aria-label="Desasignar del tablero"
                                    >
                                        &times;
                                    </button>
                                </div>
                            )})}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default KanbanBoard;

