// frontend/src/components/modal/UnifiedProcessModal.tsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import type { KanbanStatus, AnyProcess, Country } from '../../types/process';
import { ProcessContext } from '../../context/ProcessContext';
import { useProcessData } from '../../hooks/useProcessData';

import ModalHeader from './ModalHeader';
import ITTOSection from './ITTOSection';

const UnifiedProcessModal: React.FC = () => {
    const navigate = useNavigate();
    // Se elimina `setSelectedCountry` porque el modal ya no debe controlar el estado global.
    const { updateProcessInState } = useContext(ProcessContext);
    const { process, setProcess, loading, error, apiEndpoint, processType } = useProcessData();

    const handleClose = () => navigate(-1);

    const handleKanbanStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as KanbanStatus;
        if (!process) return;

        const oldProcess = { ...process };
        const updatedProcessPreview = { ...process, kanban_status: newStatus };

        // Actualización optimista
        setProcess(updatedProcessPreview);
        updateProcessInState(process.id, processType, updatedProcessPreview);

        try {
            await apiClient.patch(`/${apiEndpoint}/${process.id}/update-kanban-status/`, {
                kanban_status: newStatus,
            });
        } catch (err) {
            console.error('Error updating Kanban status:', err);
            // Revertir en caso de error
            setProcess(oldProcess);
            updateProcessInState(process.id, processType, oldProcess);
            alert('No se pudo actualizar el estado. Por favor, inténtalo de nuevo.');
        }
    };

	// --- LÓGICA CORREGIDA ---
	// Al cambiar el país en el modal, SÓLO se guarda la personalización
	// para este proceso específico y se actualiza la UI localmente. NO afecta al estado global.
    const handleCountryChange = async (country: Country | null) => {
        if (!process) return;

        const oldProcess = { ...process };
        const oldCustomization = process.customization;

        // Caso 1: Se selecciona un país.
        if (country) {
            const updatedCustomization = {
                id: oldCustomization?.id ?? -1, // -1 es un placeholder si es una nueva personalización
                country_code: country.code,
                // Se usan los ITTOs que están actualmente en el modal como base para la personalización
                inputs: process.inputs,
                tools_and_techniques: process.tools_and_techniques,
                outputs: process.outputs,
            };

            const updatedProcessPreview: AnyProcess = { ...process, customization: updatedCustomization };

            // Actualización optimista de la UI (tanto en el modal como en el estado global)
            setProcess(updatedProcessPreview);
            updateProcessInState(process.id, processType, updatedProcessPreview);

            try {
                // Llamada al endpoint para crear o actualizar la personalización en la BD
                await apiClient.post('/customizations/', {
                    process_id: process.id,
                    process_type: processType,
                    country_code: country.code,
                    inputs: process.inputs,
                    tools_and_techniques: process.tools_and_techniques,
                    outputs: process.outputs,
                });
            } catch (err) {
                console.error('Error guardando la personalización del país:', err);
                // Revertir en caso de error
                setProcess(oldProcess);
                updateProcessInState(process.id, processType, oldProcess);
                alert('No se pudo guardar la selección del país. Inténtalo de nuevo.');
            }
        } else {
            // Caso 2: Se selecciona "Sin País".
            // Se elimina la personalización localmente, pero NO se toca el país global.
            const updatedProcessPreview: AnyProcess = { ...process, customization: null };
            setProcess(updatedProcessPreview);
            updateProcessInState(process.id, processType, updatedProcessPreview);
            
            // Nota: La implementación actual no borra la personalización de la BD, solo la
            // quita de la vista. Si se volviera a seleccionar el país, los datos reaparecerían.
        }
    };

    const renderContent = () => {
        if (loading) return <div className="p-8 text-center text-gray-600">Cargando detalles...</div>;
        if (error) return <div className="p-8 text-center text-red-600 font-semibold">{error}</div>;
        if (!process) return null;

        return (
            <>
                <ModalHeader
                    process={process}
                    onClose={handleClose}
                    onKanbanStatusChange={handleKanbanStatusChange}
                    onCountryChange={handleCountryChange}
                />
                <ITTOSection
                    process={process}
                    setProcess={setProcess as React.Dispatch<React.SetStateAction<AnyProcess | null>>}
                    apiEndpoint={apiEndpoint}
                />
                <div className="p-4 bg-gray-100 rounded-b-xl border-t text-right">
                    <button onClick={handleClose} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-md hover:bg-gray-700">
                        Cerrar
                    </button>
                </div>
            </>
        );
    };

    return (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 flex justify-center items-center p-4" onClick={handleClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {renderContent()}
            </div>
        </div>
    );
};

export default UnifiedProcessModal;
