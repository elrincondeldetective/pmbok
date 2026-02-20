// frontend/src/components/modal/ModalHeader.tsx
import React, { useContext } from 'react';
import type {
    AnyProcess,
    KanbanStatus,
    IPMBOKProcess,
    IScrumProcess,
    Country,
} from '../../types/process';
import { countryMap } from '../../data/countries';
import CountrySelector from '../common/CountrySelector';
import DepartmentSelector from '../common/DepartmentSelector'; // Importar el nuevo componente
import { ProcessContext } from '../../context/ProcessContext'; // Importar el contexto

const kanbanStatusOptions: { value: KanbanStatus; label: string }[] = [
    { value: 'unassigned', label: 'No Asignado' },
    { value: 'backlog', label: 'Pendiente' },
    { value: 'todo', label: 'Por Hacer' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'in_review', label: 'En Revisión' },
    { value: 'done', label: 'Hecho' },
];

interface ModalHeaderProps {
    process: AnyProcess;
    onClose: () => void;
    onKanbanStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onCountryChange: (country: Country | null) => void;
    onSelectCustomization: (countryCode: string | null) => void;
    // ===== INICIO: CAMBIO - AÑADIR NUEVO PROP =====
    onDepartmentChange: (departmentId: number | null) => void;
    // ===== FIN: CAMBIO =====
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
    process,
    onClose,
    onKanbanStatusChange,
    onCountryChange,
    onSelectCustomization,
    // ===== INICIO: CAMBIO - DESTRUCTURAR NUEVO PROP =====
    onDepartmentChange,
    // ===== FIN: CAMBIO =====
}) => {
    // ===== INICIO: CAMBIO - OBTENER DEPARTAMENTOS DEL CONTEXTO =====
    const { departments } = useContext(ProcessContext);
    // ===== FIN: CAMBIO =====

    const isPmbok = process.type === 'pmbok';
    const group = isPmbok
        ? (process as IPMBOKProcess).stage
        : (process as IScrumProcess).phase;
    const frameworkName = isPmbok ? 'PMBOK® 6' : 'SCRUM GUIDE';

    const selectedCountryCode = process.activeCustomization?.country_code || null;
    const currentKanbanStatus =
        process.activeCustomization?.kanban_status ?? process.kanban_status;

    const isLockedOnBoard = ['backlog', 'todo', 'in_progress', 'in_review', 'done'].includes(
        currentKanbanStatus
    );
    const countryName =
        selectedCountryCode
            ? countryMap.get(selectedCountryCode) ?? selectedCountryCode.toUpperCase()
            : null;
    
    // ===== INICIO: CAMBIO - OBTENER ID DEL DEPARTAMENTO ACTUAL =====
    const currentDepartmentId = process.activeCustomization?.department?.id || null;
    // ===== FIN: CAMBIO =====

    return (
        <div
            className={`p-6 rounded-t-xl ${process.status?.tailwind_bg_color || 'bg-gray-700'
                } ${process.status?.tailwind_text_color || 'text-white'}`}
        >
            <div className="flex justify-between items-start gap-4">
                <div className="flex-grow">
                    <h2 className="text-2xl font-bold">
                        {process.process_number}. {process.name}
                    </h2>

                    <div className="mt-2 flex items-center gap-4 flex-wrap">
                        {isLockedOnBoard ? (
                            <span
                                title="No disponible en el tablero Kanban"
                                className="inline-block bg-white/25 text-white/95 text-xs font-bold px-3 py-1 rounded-full shadow-sm cursor-not-allowed"
                                aria-disabled
                            >
                                {frameworkName}
                            </span>
                        ) : (
                            <button
                                onClick={() => onSelectCustomization(null)}
                                title="Ver versión original de la guía"
                                className="inline-block bg-white/25 text-white/95 text-xs font-bold px-3 py-1 rounded-full shadow-sm hover:bg-white/40 transition-colors"
                            >
                                {frameworkName}
                            </button>
                        )}

                        {group && <p className="text-sm opacity-90">{group.name}</p>}

                        {isLockedOnBoard && selectedCountryCode && countryName ? (
                            <div className="inline-flex items-center rounded-full bg-white/25 text-white/95 text-xs font-bold px-3 py-1 shadow-sm cursor-not-allowed">
                                <img
                                    src={`https://flagcdn.com/w20/${selectedCountryCode}.png`}
                                    width="20"
                                    alt={`Bandera de ${countryName}`}
                                    className="mr-2"
                                />
                                <span>{countryName}</span>
                            </div>
                        ) : (
                            <CountrySelector
                                value={selectedCountryCode}
                                onChange={onCountryChange}
                                allowClear
                            />
                        )}
                    </div>

                    {process.customizations && process.customizations.length > 0 && (
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                            <p className="text-xs font-semibold opacity-80">✅ Aplicado en:</p>
                            <div className="flex items-center gap-2 flex-wrap">
                                {isLockedOnBoard ? (
                                    selectedCountryCode && (
                                        <div
                                            className="flex items-center bg-white/25 text-white/95 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-not-allowed"
                                            title="No editable en el tablero"
                                            aria-disabled
                                        >
                                            <img
                                                src={`https://flagcdn.com/w20/${selectedCountryCode.toLowerCase()}.png`}
                                                width="12"
                                                alt={`${selectedCountryCode} flag`}
                                                className="mr-1.5"
                                            />
                                            {selectedCountryCode.toUpperCase()}
                                        </div>
                                    )
                                ) : (
                                    process.customizations.map((cust) => (
                                        <button
                                            key={cust.country_code}
                                            onClick={() => onSelectCustomization(cust.country_code)}
                                            title={`Ver versión para ${cust.country_code.toUpperCase()}`}
                                            className="flex items-center bg-white/25 text-white/95 text-[10px] font-bold px-2 py-0.5 rounded-full hover:bg-white/40 hover:scale-110 transition-all"
                                        >
                                            <img
                                                src={`https://flagcdn.com/w20/${cust.country_code.toLowerCase()}.png`}
                                                width="12"
                                                alt={`${cust.country_code} flag`}
                                                className="mr-1.5"
                                            />
                                            {cust.country_code.toUpperCase()}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ===== INICIO: CAMBIO - REESTRUCTURAR CONTROLES DERECHOS ===== */}
                <div className="flex-shrink-0 flex flex-col items-end gap-4">
                    <div className="flex items-center gap-4">
                        <select
                            value={currentKanbanStatus}
                            onChange={onKanbanStatusChange}
                            disabled={!process.activeCustomization}
                            className="bg-white/20 text-white text-sm font-semibold rounded-md p-2 border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            onClick={(e) => e.stopPropagation()}
                            title={!process.activeCustomization ? "Selecciona una versión de país para cambiar el estado" : "Cambiar estado Kanban"}
                        >
                            {kanbanStatusOptions.map((option) => (
                                <option key={option.value} value={option.value} className="text-black">
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={onClose}
                            className="text-2xl font-bold hover:opacity-75 transition-opacity"
                            aria-label="Cerrar modal"
                        >
                            &times;
                        </button>
                    </div>

                    <DepartmentSelector
                        value={currentDepartmentId}
                        onChange={onDepartmentChange}
                        departments={departments}
                        disabled={!process.activeCustomization}
                    />
                </div>
                {/* ===== FIN: CAMBIO ===== */}

            </div>
        </div>
    );
};

export default ModalHeader;
