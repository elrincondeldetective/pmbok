// frontend/src/components/modal/UnifiedProcessModal.tsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import type { KanbanStatus, AnyProcess, Country, IProcessCustomization } from '../../types/process';
import { ProcessContext } from '../../context/ProcessContext';
import { useProcessData } from '../../hooks/useProcessData';

import ModalHeader from './ModalHeader';
import ITTOSection from './ITTOSection';

const UnifiedProcessModal: React.FC = () => {
    const navigate = useNavigate();
    const { updateProcessInState, processes: allGlobalProcesses, addOrUpdateCustomization, updateCustomizationStatus } = useContext(ProcessContext);
    const { process, setProcess, loading, error, apiEndpoint, processType } = useProcessData();

    const handleClose = () => navigate(-1);

    const handleKanbanStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as KanbanStatus;
        if (!process) return;

        // Si hay una personalización activa, actualizamos su estado específico.
        if (process.activeCustomization) {
            const customizationId = process.activeCustomization.id;
            
            // Actualización optimista de UI
            const updatedCustomization = { ...process.activeCustomization, kanban_status: newStatus };
            setProcess({ ...process, activeCustomization: updatedCustomization });
            updateCustomizationStatus(process.id, process.type, customizationId, newStatus);
            
            try {
                await apiClient.patch(`/customizations/${customizationId}/update-kanban-status/`, {
                    kanban_status: newStatus,
                });
            } catch (err) {
                console.error('Error updating customization Kanban status:', err);
                // Revertir
                updateCustomizationStatus(process.id, process.type, customizationId, process.activeCustomization.kanban_status);
                alert('No se pudo actualizar el estado. Por favor, inténtalo de nuevo.');
            }
        } else {
            // Si no hay personalización, se actualiza el estado del proceso base (comportamiento anterior).
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
        }
    };

    const handleCountryChange = async (country: Country | null) => {
        if (!process) return;

        const originalProcess = allGlobalProcesses.find(p => p.id === process.id && p.type === process.type);
        if (!originalProcess) {
            console.error("No se pudo encontrar el proceso original en el contexto global.");
            return;
        }

        let updatedProcess: AnyProcess;

        if (country) {
            const existingCustomization = originalProcess.customizations.find(c => c.country_code === country.code);
            
            if (existingCustomization) {
                updatedProcess = {
                    ...originalProcess,
                    inputs: existingCustomization.inputs,
                    tools_and_techniques: existingCustomization.tools_and_techniques,
                    outputs: existingCustomization.outputs,
                    activeCustomization: existingCustomization,
                };
            } else {
                updatedProcess = {
                    ...originalProcess,
                    activeCustomization: {
                        id: -1, // ID temporal
                        country_code: country.code,
                        inputs: originalProcess.inputs,
                        tools_and_techniques: originalProcess.tools_and_techniques,
                        outputs: originalProcess.outputs,
                        kanban_status: 'backlog', // Estado inicial para nuevas personalizaciones
                    },
                };
            }
        } else {
            updatedProcess = {
                ...originalProcess,
                activeCustomization: undefined,
            };
        }

        setProcess(updatedProcess);

        if (country) {
            try {
                const payload = {
                    process_id: process.id,
                    process_type: process.type,
                    country_code: country.code,
                    inputs: updatedProcess.inputs,
                    tools_and_techniques: updatedProcess.tools_and_techniques,
                    outputs: updatedProcess.outputs,
                };
                const response = await apiClient.post<IProcessCustomization>('/customizations/', payload);
                const savedCustomization = response.data;
                addOrUpdateCustomization(process.id, process.type, savedCustomization);
                
                // Actualiza el modal para reflejar la personalización guardada (con el ID correcto)
                setProcess(prev => prev ? {...prev, activeCustomization: savedCustomization} : null);

            } catch (err) {
                console.error('Error guardando la personalización del país:', err);
                setProcess(process); // Revertir
                alert('No se pudo guardar la selección del país.');
            }
        }
    };

    const handleSelectCustomization = (countryCode: string | null) => {
        if (!process) return;

        const originalProcess = allGlobalProcesses.find(p => p.id === process.id && p.type === process.type);
        if (!originalProcess) return;

        let processToShow: AnyProcess;

        if (countryCode) {
            const customization = originalProcess.customizations.find(c => c.country_code === countryCode);
            if (customization) {
                processToShow = {
                    ...originalProcess,
                    inputs: customization.inputs,
                    tools_and_techniques: customization.tools_and_techniques,
                    outputs: customization.outputs,
                    activeCustomization: customization,
                };
            } else {
                processToShow = { ...originalProcess, activeCustomization: undefined };
            }
        } else {
            processToShow = { ...originalProcess, activeCustomization: undefined };
        }
        setProcess(processToShow);
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
                    onSelectCustomization={handleSelectCustomization}
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
