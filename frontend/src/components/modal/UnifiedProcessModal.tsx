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
    const { updateProcessInState } = useContext(ProcessContext);
    const { process, setProcess, loading, error, apiEndpoint, processType } = useProcessData();

    const handleClose = () => navigate(-1);

    const handleKanbanStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as KanbanStatus;
        if (!process) return;

        const oldProcess = { ...process };
        const updatedProcessPreview = { ...process, kanban_status: newStatus };

        setProcess(updatedProcessPreview);
        updateProcessInState(process.id, processType, updatedProcessPreview);

        try {
            await apiClient.patch(`/${apiEndpoint}/${process.id}/update-kanban-status/`, {
                kanban_status: newStatus,
            });
        } catch (err) {
            console.error('Error updating Kanban status:', err);
            setProcess(oldProcess);
            updateProcessInState(process.id, processType, oldProcess);
            alert('No se pudo actualizar el estado. Por favor, inténtalo de nuevo.');
        }
    };

	// --- LÓGICA DE GUARDADO DE PAÍS AJUSTADA ---
    const handleCountryChange = async (country: Country | null) => {
        if (!process) return;

        const oldProcess = { ...process };

        // Prepara los datos para la API. Se envían los ITTOs actuales del modal.
        const customizationPayload = {
            process_id: process.id,
            process_type: processType,
            country_code: country?.code, // será undefined si country es null
            inputs: process.inputs,
            tools_and_techniques: process.tools_and_techniques,
            outputs: process.outputs,
        };

        // Actualización optimista de la UI
        let updatedProcessPreview: AnyProcess;
        if (country) {
            // Si se selecciona un país, se crea o actualiza su personalización en el array.
            const otherCustomizations = process.customizations.filter(c => c.country_code !== country.code);
            const newCustomization = {
                id: process.customizations.find(c => c.country_code === country.code)?.id ?? -1,
                ...customizationPayload
            };
            updatedProcessPreview = { ...process, customizations: [newCustomization, ...otherCustomizations] };
        } else {
            // Si se selecciona "Sin País", el array de personalizaciones se vacía.
            // NOTA: Esto eliminará TODAS las personalizaciones de país para este proceso.
            updatedProcessPreview = { ...process, customizations: [] };
        }

        setProcess(updatedProcessPreview);
        updateProcessInState(process.id, processType, updatedProcessPreview);

        try {
            if (country) {
                // Endpoint para crear o actualizar una personalización
                await apiClient.post('/customizations/', customizationPayload);
            } else {
                // Aquí iría la lógica para borrar la personalización si se implementa en el backend.
                // Por ahora, solo se actualiza la UI.
            }
        } catch (err) {
            console.error('Error guardando la personalización del país:', err);
            setProcess(oldProcess);
            updateProcessInState(process.id, processType, oldProcess);
            alert('No se pudo guardar la selección del país. Inténtalo de nuevo.');
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
