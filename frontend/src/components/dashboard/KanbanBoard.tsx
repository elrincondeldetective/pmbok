// frontend/src/components/dashboard/KanbanBoard.tsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
// ===== INICIO: CAMBIO - IMPORTAR NUEVOS TIPOS =====
import type { AnyProcess, KanbanStatus, IProcessCustomization, IProcessStatus, IProcessStage, IScrumPhase, IDepartment, ISubDepartment } from '../../types/process';
// ===== FIN: CAMBIO =====
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


// ===== INICIO: CAMBIO - INTERFAZ DE TARJETA ACTUALIZADA =====
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
    // Departamento asociado
    department: ISubDepartment | null;
}
// ===== FIN: CAMBIO =====

// ===== INICIO: NUEVO COMPONENTE INTERNO PARA FILTROS =====
interface DepartmentFilterProps {
    departments: IDepartment[];
    selectedDepartment: number | null;
    onSelectDepartment: (id: number | null) => void;
}

const DepartmentFilter: React.FC<DepartmentFilterProps> = ({ departments, selectedDepartment, onSelectDepartment }) => {
    // Mostramos solo los departamentos de nivel superior para un filtro más limpio
    const topLevelDepartments = departments.filter(d => d.parent === null);

    if (topLevelDepartments.length === 0) return null;

    return (
        <div className="mb-8 flex items-center justify-center gap-2 flex-wrap">
            <button
                onClick={() => onSelectDepartment(null)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${selectedDepartment === null ? 'bg-gray-800 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-200 border'}`}
            >
                Todos los Departamentos
            </button>
            {topLevelDepartments.map(dept => (
                <button
                    key={dept.id}
                    onClick={() => onSelectDepartment(dept.id)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors border-2 ${selectedDepartment === dept.id ? `${dept.tailwind_border_color} bg-gray-800 text-white shadow` : `bg-white text-gray-700 hover:bg-gray-200 ${dept.tailwind_border_color}`}`}
                >
                    {dept.name}
                </button>
            ))}
        </div>
    );
};
// ===== FIN: NUEVO COMPONENTE INTERNO =====


const KanbanBoard: React.FC = () => {
    const location = useLocation();
    // ===== INICIO: CAMBIO - OBTENER DEPARTAMENTOS Y NUEVO ESTADO DE FILTRO =====
    const { processes, selectedCountry, updateCustomizationStatus, departments } = useContext(ProcessContext);
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
    // ===== FIN: CAMBIO =====
    
    const [columns, setColumns] = useState<Record<KanbanColumnStatus, KanbanCard[]>>({
        backlog: [], todo: [], in_progress: [], in_review: [], done: []
    });

    useEffect(() => {
        const expandedCards: KanbanCard[] = [];
        processes.forEach(process => {
            if (process.customizations.length > 0) {
                process.customizations.forEach(cust => {
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
                            // ===== INICIO: CAMBIO - AÑADIR DEPARTAMENTO A LA TARJETA =====
                            department: cust.department,
                            // ===== FIN: CAMBIO =====
                        });
                    }
                });
            }
        });

        // Filtrado por país (sin cambios)
        const countryFilteredCards = selectedCountry
            ? expandedCards.filter(card => card.country_code === selectedCountry.code)
            : expandedCards;

        // ===== INICIO: CAMBIO - AÑADIR FILTRADO POR DEPARTAMENTO =====
        // Filtra por el departamento padre seleccionado, incluyendo las tarjetas de sus subdepartamentos.
        const departmentFilteredCards = selectedDepartment
            ? countryFilteredCards.filter(card => {
                if (!card.department) return false;
                if (card.department.id === selectedDepartment) return true; // Coincidencia directa
                // Buscar si el padre del departamento de la tarjeta coincide
                const departmentDetails = departments.find(d => d.id === card.department?.id);
                return departmentDetails?.parent === selectedDepartment;
            })
            : countryFilteredCards;
        // ===== FIN: CAMBIO =====

        // Agrupar tarjetas en columnas
        const newColumns: Record<KanbanColumnStatus, KanbanCard[]> = {
            backlog: [], todo: [], in_progress: [], in_review: [], done: []
        };
        departmentFilteredCards.forEach(card => {
            if (newColumns[card.kanban_status]) {
                newColumns[card.kanban_status].push(card);
            }
        });
        setColumns(newColumns);
    }, [processes, selectedCountry, selectedDepartment, departments]);


    // La lógica de Drag & Drop no necesita cambios, ya que opera sobre el objeto `KanbanCard` que ya está actualizado.
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, card: KanbanCard, fromColumn: KanbanColumnStatus) => {
        e.dataTransfer.setData('cardData', JSON.stringify(card));
        e.dataTransfer.setData('fromColumn', fromColumn);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, toColumn: KanbanColumnStatus) => {
        const cardData: KanbanCard = JSON.parse(e.dataTransfer.getData('cardData'));
        const fromColumn = e.dataTransfer.getData('fromColumn') as KanbanColumnStatus;

        if (cardData && fromColumn !== toColumn) {
            const movedCard = { ...cardData, kanban_status: toColumn };

            setColumns(prev => ({
                ...prev,
                [fromColumn]: prev[fromColumn].filter(c => c.customizationId !== cardData.customizationId),
                [toColumn]: [...prev[toColumn], movedCard],
            }));

            try {
                await apiClient.patch(`/customizations/${cardData.customizationId}/update-kanban-status/`, {
                    kanban_status: toColumn
                });
                updateCustomizationStatus(cardData.id, cardData.type, cardData.customizationId, toColumn);
            } catch (error) {
                console.error("Error al actualizar el estado:", error);
                setColumns(prev => ({
                    ...prev,
                    [toColumn]: prev[toColumn].filter(c => c.customizationId !== cardData.customizationId),
                    [fromColumn]: [...prev[fromColumn], cardData],
                }));
            }
        }
    };

    const handleRemoveFromKanban = async (card: KanbanCard, currentColumn: KanbanColumnStatus) => {
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
            setColumns(prev => ({
                ...prev,
                [currentColumn]: [...prev[currentColumn], card]
            }));
        }
    };


    return (
        <section>
            <SectionHeader title="Tablero Kanban de Procesos" subtitle="Arrastra y suelta las tarjetas para organizar tu flujo de trabajo." />
            {/* ===== INICIO: CAMBIO - AÑADIR EL COMPONENTE DE FILTRO ===== */}
            <DepartmentFilter 
                departments={departments}
                selectedDepartment={selectedDepartment}
                onSelectDepartment={setSelectedDepartment}
            />
            {/* ===== FIN: CAMBIO ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {columnOrder.map(columnKey => (
                    <div key={columnKey} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, columnKey)} className="bg-gray-200/50 rounded-lg p-4 flex flex-col">
                        <div className={`text-center pb-3 mb-3 border-b-4 ${columnConfig[columnKey].color}`}>
                            <h3 className="font-bold text-gray-700">{columnConfig[columnKey].title}</h3>
                            <span className="bg-gray-300 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">{columns[columnKey]?.length || 0}</span>
                        </div>
                        <div className="space-y-4 flex-grow min-h-48 max-h-[30rem] overflow-y-auto pr-2">
                            {columns[columnKey]?.map(card => {
                                const group = card.type === 'pmbok' ? card.stage : card.phase;
                                const linkTarget = card.type === 'pmbok' ? `/process/${card.id}` : `/scrum-process/${card.id}`;
                                const borderColor = card.type === 'pmbok' ? 'border-l-blue-500' : 'border-l-green-500';

                                return (
                                    <div key={card.customizationId} draggable onDragStart={e => handleDragStart(e, card, columnKey)} className="relative group">
                                        <Link to={linkTarget} state={{ background: location, countryCode: card.country_code }} className={`bg-white rounded-lg shadow flex flex-col cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-l-4 ${borderColor}`}>
                                            <div className={`p-3 rounded-t-lg text-center ${card.status ? `${card.status.tailwind_bg_color} ${card.status.tailwind_text_color}` : 'bg-gray-500 text-white'}`}>
                                                <p className="text-sm font-bold leading-tight truncate" title={card.name}>{card.process_number}. {card.name}</p>
                                                
                                                {/* ===== INICIO: CAMBIO - MOSTRAR EL DEPARTAMENTO EN LA TARJETA ===== */}
                                                {card.department && (
                                                    <div className="mt-1.5">
                                                        <span className={`inline-block text-white/90 text-[10px] font-bold px-2 py-0.5 rounded-full border-2 ${card.department.tailwind_border_color} bg-black/20`} title={card.department.name}>
                                                            {card.department.name}
                                                        </span>
                                                    </div>
                                                )}
                                                {/* ===== FIN: CAMBIO ===== */}

                                                <div className="mt-1.5 flex justify-center items-center gap-2">
                                                    <span className="inline-block bg-white/25 text-white/95 text-[10px] font-bold px-2 py-0.5 rounded-full">{card.type === 'pmbok' ? 'PMBOK® 6' : 'SCRUM'}</span>
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
