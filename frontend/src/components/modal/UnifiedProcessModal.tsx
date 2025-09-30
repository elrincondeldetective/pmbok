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
    const { updateProcessInState, setSelectedCountry } = useContext(ProcessContext);
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

    // 👉 Al cambiar el país en el modal, se guarda en la BD y se sincroniza el país global.
    const handleCountryChange = async (country: Country | null) => {
        if (!process) return;

        const oldProcess = { ...process };
        const oldCustomization = process.customization;

        // Si se selecciona un país, creamos o actualizamos su objeto de personalización.
        if (country) {
            // 🔑 Mantén sincronizado el país global (contexto + localStorage)
            setSelectedCountry(country);

            const updatedCustomization = {
                id: oldCustomization?.id ?? -1, // -1 es un placeholder si es nuevo
                country_code: country.code,
                // Usamos los ITTOs que están actualmente en el modal como la base para la personalización
                inputs: process.inputs,
                tools_and_techniques: process.tools_and_techniques,
                outputs: process.outputs,
            };

            const updatedProcessPreview: AnyProcess = { ...process, customization: updatedCustomization };
            
            // Actualización optimista de la UI
            setProcess(updatedProcessPreview);
            updateProcessInState(process.id, processType, updatedProcessPreview);

            try {
                // Llamada al nuevo endpoint para crear/actualizar la personalización
                await apiClient.post('/customizations/', {
                    process_id: process.id,
                    process_type: processType,
                    country_code: country.code,
                    // Enviamos los ITTOs actuales para guardarlos
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
            // Si se selecciona "Sin País" (country es null), eliminamos la personalización localmente
            // y limpiamos el país global (así no se pedirá ?country=XX al recargar).
            setSelectedCountry(null);

            const updatedProcessPreview: AnyProcess = { ...process, customization: null };
            setProcess(updatedProcessPreview);
            updateProcessInState(process.id, processType, updatedProcessPreview);
            
            // TODO (Opcional): Implementar una llamada a un endpoint DELETE para
            // eliminar el registro de personalización de la base de datos si es necesario.
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
