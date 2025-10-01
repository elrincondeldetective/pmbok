// frontend/src/components/dashboard/KanbanBoard.tsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { AnyProcess, KanbanStatus, IProcessCustomization, IProcessStatus, IProcessStage, IScrumPhase } from '../../types/process';
import apiClient from '../../api/apiClient';
import SectionHeader from '../common/SectionHeader';
import { ProcessContext } from '../../context/ProcessContext';

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


// ===== INICIO: NUEVA INTERFAZ PARA LAS TARJETAS FLATTENED =====
interface KanbanCard {
    // Info del proceso base
    id: number;
    process_number: number;
    name: string;
    type: 'pmbok' | 'scrum';
    status: IProcessStatus | null;
    stage: IProcessStage | null;
    phase: IScrumPhase | null;
    // Info de la personalización específica
    customizationId: number;
    country_code: string;
    // Estado Kanban de la tarjeta
    kanban_status: KanbanStatus;
}
// ===== FIN: NUEVA INTERFAZ =====

const KanbanBoard: React.FC = () => {
    const location = useLocation();
    // ===== CAMBIO 1: Obtener la nueva función del contexto =====
    const { processes, selectedCountry, updateCustomizationStatus } = useContext(ProcessContext);
    
    // ===== CAMBIO 2: El estado ahora maneja objetos KanbanCard =====
    const [columns, setColumns] = useState<Record<KanbanColumnStatus, KanbanCard[]>>({
        backlog: [], todo: [], in_progress: [], in_review: [], done: []
    });

    // ===== CAMBIO 3: Lógica para expandir procesos en tarjetas individuales =====
    useEffect(() => {
        const expandedCards: KanbanCard[] = [];
        processes.forEach(process => {
            // Un proceso general puede estar "unassigned", pero sus personalizaciones individuales no.
            // Si el proceso tiene personalizaciones, las iteramos para crear las tarjetas.
            if (process.customizations.length > 0) {
                process.customizations.forEach(cust => {
                    // Crear una tarjeta solo si la personalización específica tiene un estado Kanban visible.
                    if (cust.kanban_status !== 'unassigned') {
                        expandedCards.push({
                            id: process.id,
                            process_number: process.process_number,
                            name: process.name,
                            type: process.type,
                            status: process.status,
                            stage: (process as any).stage || null,
                            phase: (process as any).phase || null,
                            customizationId: cust.id,
                            country_code: cust.country_code,
                            kanban_status: cust.kanban_status,
                        });
                    }
                });
            }
        });

        // Filtrar por país si hay uno seleccionado globalmente
        const filteredCards = selectedCountry
            ? expandedCards.filter(card => card.country_code === selectedCountry.code)
            : expandedCards;

        // Agrupar las tarjetas en sus columnas correspondientes
        const newColumns: Record<KanbanColumnStatus, KanbanCard[]> = {
            backlog: [], todo: [], in_progress: [], in_review: [], done: []
        };
        filteredCards.forEach(card => {
            if (newColumns[card.kanban_status]) {
                newColumns[card.kanban_status].push(card);
            }
        });
        setColumns(newColumns);
    }, [processes, selectedCountry]);


    // ===== CAMBIO 4: Actualizar lógica de Drag & Drop =====
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, card: KanbanCard, fromColumn: KanbanColumnStatus) => {
        e.dataTransfer.setData('cardData', JSON.stringify(card));
        e.dataTransfer.setData('fromColumn', fromColumn);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, toColumn: KanbanColumnStatus) => {
        const cardData: KanbanCard = JSON.parse(e.dataTransfer.getData('cardData'));
        const fromColumn = e.dataTransfer.getData('fromColumn') as KanbanColumnStatus;

        if (cardData && fromColumn !== toColumn) {
            const movedCard = { ...cardData, kanban_status: toColumn };

            // Actualización optimista de la UI
            setColumns(prev => ({
                ...prev,
                [fromColumn]: prev[fromColumn].filter(c => c.customizationId !== cardData.customizationId),
                [toColumn]: [...prev[toColumn], movedCard],
            }));

            try {
                // Llamar al nuevo endpoint de la API
                await apiClient.patch(`/customizations/${cardData.customizationId}/update-kanban-status/`, {
                    kanban_status: toColumn
                });
                // Actualizar el estado global en el contexto
                updateCustomizationStatus(cardData.id, cardData.type, cardData.customizationId, toColumn);
            } catch (error) {
                console.error("Error al actualizar el estado:", error);
                // Revertir UI en caso de error
                setColumns(prev => ({
                    ...prev,
                    [toColumn]: prev[toColumn].filter(c => c.customizationId !== cardData.customizationId),
                    [fromColumn]: [...prev[fromColumn], cardData],
                }));
            }
        }
    };

    const handleRemoveFromKanban = async (card: KanbanCard, currentColumn: KanbanColumnStatus) => {
        // Actualización optimista
        setColumns(prev => ({
            ...prev,
            [currentColumn]: prev[currentColumn].filter(c => c.customizationId !== card.customizationId),
        }));

        try {
            await apiClient.patch(`/customizations/${card.customizationId}/update-kanban-status/`, {
                kanban_status: 'unassigned'
            });
            updateCustomizationStatus(card.id, card.type, card.customizationId, 'unassigned');
        } catch (error) {
            console.error("Error al desasignar el proceso:", error);
            // Revertir
            setColumns(prev => ({
                ...prev,
                [currentColumn]: [...prev[currentColumn], card]
            }));
        }
    };


    return (
        <section>
            <SectionHeader title="Tablero Kanban de Procesos" subtitle="Arrastra y suelta las tarjetas para organizar tu flujo de trabajo." />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {columnOrder.map(columnKey => (
                    <div key={columnKey} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, columnKey)} className="bg-gray-200/50 rounded-lg p-4 flex flex-col">
                        <div className={`text-center pb-3 mb-3 border-b-4 ${columnConfig[columnKey].color}`}>
                            <h3 className="font-bold text-gray-700">{columnConfig[columnKey].title}</h3>
                            <span className="bg-gray-300 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">{columns[columnKey]?.length || 0}</span>
                        </div>
                        <div className="space-y-4 flex-grow min-h-48 max-h-[30rem] overflow-y-auto pr-2">
                            {/* ===== CAMBIO 5: Mapear sobre las nuevas tarjetas ===== */}
                            {columns[columnKey]?.map(card => {
                                const group = card.type === 'pmbok' ? card.stage : card.phase;
                                const linkTarget = card.type === 'pmbok' ? `/process/${card.id}` : `/scrum-process/${card.id}`;
                                const borderColor = card.type === 'pmbok' ? 'border-l-blue-500' : 'border-l-green-500';

                                return (
                                    <div key={card.customizationId} draggable onDragStart={e => handleDragStart(e, card, columnKey)} className="relative group">
                                        <Link to={linkTarget} state={{ background: location, countryCode: card.country_code }} className={`bg-white rounded-lg shadow flex flex-col cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-l-4 ${borderColor}`}>
                                            <div className={`p-3 rounded-t-lg text-center ${card.status ? `${card.status.tailwind_bg_color} ${card.status.tailwind_text_color}` : 'bg-gray-500 text-white'}`}>
                                                <p className="text-sm font-bold leading-tight truncate" title={card.name}>{card.process_number}. {card.name}</p>
                                                <div className="mt-1.5 flex justify-center items-center gap-2">
                                                    <span className="inline-block bg-white/25 text-white/95 text-[10px] font-bold px-2 py-0.5 rounded-full">{card.type === 'pmbok' ? 'PMBOK® 6' : 'SCRUM'}</span>
                                                    {/* Mostrar la bandera del país de esta tarjeta específica */}
                                                    <div className="flex items-center bg-white/25 text-white/95 text-[10px] font-bold px-2 py-0.5 rounded-full" title={card.country_code.toUpperCase()}>
                                                        <img src={`https://flagcdn.com/w20/${card.country_code.toLowerCase()}.png`} width="12" alt={`${card.country_code} flag`} className="mr-1.5" />
                                                        {card.country_code.toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`border-t px-3 py-2 rounded-b-lg text-center ${group ? `${group.tailwind_bg_color} ${group.tailwind_text_color}` : 'bg-gray-200 text-gray-700'}`}>
                                                <p className="text-xs font-semibold uppercase tracking-wider truncate" title={group?.name}>{group ? group.name.split(' (')[0] : 'Grupo'}</p>
                                            </div>
                                        </Link>
                                        <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleRemoveFromKanban(card, columnKey); }} className="absolute top-1 right-1 bg-black/10 text-white/70 rounded-full w-6 h-6 flex items-center justify-center text-lg font-bold opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white" aria-label="Desasignar del tablero">&times;</button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default KanbanBoard;
