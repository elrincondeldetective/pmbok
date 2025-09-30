// frontend/src/components/modal/UnifiedProcessModal.tsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import type { KanbanStatus, ITTOItem, AnyProcess, Country } from '../../types/process';
import { ProcessContext } from '../../context/ProcessContext';
import { useProcessData } from '../../hooks/useProcessData';

import ModalHeader from './ModalHeader';
import ITTOSection from './ITTOSection';

const UnifiedProcessModal: React.FC = () => {
  const navigate = useNavigate();
  // Se obtiene el país seleccionado y su 'setter' del contexto global.
  const { updateProcessInState, selectedCountry, setSelectedCountry } = useContext(ProcessContext);
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

  // Al cambiar el país desde el modal: actualiza el contexto, previsualiza la bandera en la tarjeta
  // y persiste/actualiza la personalización en backend con update_or_create.
  const handleCountryChange = async (country: Country | null) => {
    setSelectedCountry(country);
    if (!process || !country) return;

    const oldProcess = { ...process };
    const updatedProcessPreview: AnyProcess = {
      ...process,
      customization: {
        id: process.customization?.id ?? -1, // placeholder local si aún no existe
        country_code: country.code,
        inputs: process.inputs,
        tools_and_techniques: process.tools_and_techniques,
        outputs: process.outputs,
      },
    } as AnyProcess;

    setProcess(updatedProcessPreview);
    updateProcessInState(process.id, processType, updatedProcessPreview);

    try {
      await apiClient.post('/customizations/', {
        process_id: process.id,
        process_type: processType,
        country_code: country.code,
        inputs: process.inputs,
        tools_and_techniques: process.tools_and_techniques,
        outputs: process.outputs,
      });
    } catch (err) {
      console.error('Error guardando la selección de país:', err);
      setProcess(oldProcess);
      updateProcessInState(process.id, processType, oldProcess);
      alert('No se pudo guardar el país. Inténtalo de nuevo.');
    }
  };

  const handlePersistITTOs = async (updatedITTOs: {
    inputs: ITTOItem[];
    tools_and_techniques: ITTOItem[];
    outputs: ITTOItem[];
  }) => {
    if (!process || !selectedCountry) {
      alert("Error: No hay un país seleccionado. No se pueden guardar los cambios.");
      return;
    }

    const oldProcess = { ...process };
    // Previsualiza el cambio en la UI con los nuevos ITTOs y el objeto de personalización.
    const updatedProcessPreview = {
      ...process,
      ...updatedITTOs,
      customization: {
        ...(process.customization || { id: -1 }), // Mantén id si existe
        country_code: selectedCountry.code,
        ...updatedITTOs,
      }
    };

    setProcess(updatedProcessPreview as AnyProcess);
    updateProcessInState(process.id, processType, updatedProcessPreview);

    try {
      await apiClient.post('/customizations/', {
        process_id: process.id,
        process_type: processType,
        country_code: selectedCountry.code,
        ...updatedITTOs,
      });
    } catch (err) {
      console.error('Error guardando la personalización:', err);
      setProcess(oldProcess);
      updateProcessInState(process.id, processType, oldProcess);
      alert('No se pudo guardar la personalización. Inténtalo de nuevo.');
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
          // Cambiar país: actualiza contexto, previsualiza en tarjeta y persiste en BD.
          onCountryChange={handleCountryChange}
        />
        <ITTOSection
          process={process}
          setProcess={setProcess as React.Dispatch<React.SetStateAction<AnyProcess | null>>}
          // Pasa la función de persistencia al componente hijo
          onITTOsChange={handlePersistITTOs}
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
