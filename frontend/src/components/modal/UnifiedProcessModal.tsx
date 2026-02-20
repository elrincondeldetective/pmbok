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
    const { processes: allGlobalProcesses, addOrUpdateCustomization, updateCustomizationStatus, departments } = useContext(ProcessContext);
    const { process, setProcess, loading, error } = useProcessData(); // CORRECCIÓN: Se elimina apiEndpoint de aquí

    const handleClose = () => navigate(-1);

    const handleKanbanStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as KanbanStatus;
        if (!process || !process.activeCustomization) {
            alert("Por favor, selecciona una versión específica (un país) para poder cambiar su estado.");
            e.target.value = process?.kanban_status || 'unassigned';
            return;
        }

        const customizationId = process.activeCustomization.id;
        const oldStatus = process.activeCustomization.kanban_status;

        const updatedCustomization = { ...process.activeCustomization, kanban_status: newStatus };
        setProcess({ ...process, activeCustomization: updatedCustomization });
        updateCustomizationStatus(process.id, process.type, customizationId, newStatus);

        try {
            await apiClient.patch(`/customizations/${customizationId}/update-kanban-status/`, {
                kanban_status: newStatus,
            });
        } catch (err) {
            console.error('Error updating customization Kanban status:', err);
            const revertedCustomization = { ...process.activeCustomization, kanban_status: oldStatus };
            setProcess({ ...process, activeCustomization: revertedCustomization });
            updateCustomizationStatus(process.id, process.type, customizationId, oldStatus);
            alert('No se pudo actualizar el estado. Por favor, inténtalo de nuevo.');
        }
    };
    
    const handleDepartmentChange = async (departmentId: number | null) => {
        if (!process || !process.activeCustomization) {
            alert("Por favor, selecciona una versión de país antes de asignar un departamento.");
            return;
        }

        const oldCustomization = { ...process.activeCustomization };
        const newDepartment = departments.find(d => d.id === departmentId) || null;

        // 1. Actualización optimista
        const updatedCustomization = { ...process.activeCustomization, department: newDepartment };
        setProcess({ ...process, activeCustomization: updatedCustomization });
        addOrUpdateCustomization(process.id, process.type, updatedCustomization);

        // 2. Llamada a la API
        try {
            const payload = {
                process_id: process.id,
                process_type: process.type,
                country_code: process.activeCustomization.country_code,
                inputs: process.activeCustomization.inputs,
                tools_and_techniques: process.activeCustomization.tools_and_techniques,
                outputs: process.activeCustomization.outputs,
                department_id: departmentId, // Enviar el nuevo ID
            };
            
            // Usamos el endpoint de creación/actualización que ya existe
            const response = await apiClient.post<IProcessCustomization>('/customizations/', payload);
            
            // 3. Sincronizar el estado con la respuesta de la API
            addOrUpdateCustomization(process.id, process.type, response.data);
            setProcess(prev => prev ? { ...prev, activeCustomization: response.data } : null);

        } catch (error) {
            console.error("Error al actualizar el departamento:", error);
            // 4. Revertir en caso de error
            setProcess(prev => prev ? { ...prev, activeCustomization: oldCustomization } : null);
            addOrUpdateCustomization(process.id, process.type, oldCustomization);
            alert("No se pudo guardar el cambio de departamento.");
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
                        id: -1,
                        country_code: country.code,
                        inputs: originalProcess.inputs,
                        tools_and_techniques: originalProcess.tools_and_techniques,
                        outputs: originalProcess.outputs,
                        kanban_status: 'unassigned',
                        department: null, // Un nuevo país empieza sin departamento
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
                    department_id: updatedProcess.activeCustomization?.department?.id || null,
                };
                const response = await apiClient.post<IProcessCustomization>('/customizations/', payload);
                const savedCustomization = response.data;
                addOrUpdateCustomization(process.id, process.type, savedCustomization);

                setProcess(prev => prev ? { ...prev, activeCustomization: savedCustomization } : null);

            } catch (err) {
                console.error('Error guardando la personalización del país:', err);
                setProcess(process);
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
                    onDepartmentChange={handleDepartmentChange}
                />
                <ITTOSection
                    process={process}
                    setProcess={setProcess as React.Dispatch<React.SetStateAction<AnyProcess | null>>}
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

