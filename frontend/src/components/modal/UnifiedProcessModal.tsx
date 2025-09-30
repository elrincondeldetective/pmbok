// frontend/src/components/modal/UnifiedProcessModal.tsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import type { KanbanStatus, ITTOItem, AnyProcess } from '../../types/process';
import { ProcessContext } from '../../context/ProcessContext';
import { useProcessData } from '../../hooks/useProcessData';

import ModalHeader from './ModalHeader';
import ITTOSection from './ITTOSection';

const UnifiedProcessModal: React.FC = () => {
  const navigate = useNavigate();
  // Se obtiene el país seleccionado del contexto global.
  const { updateProcessInState, selectedCountry } = useContext(ProcessContext);
  const { process, setProcess, loading, error, apiEndpoint, processType } = useProcessData();

  const handleClose = () => navigate(-1);

  // La lógica para cambiar el estado de Kanban no cambia.
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

  // ===== INICIO: NUEVA FUNCIÓN PARA PERSISTIR CAMBIOS EN ITTOs POR PAÍS =====
  // Esta función reemplaza la lógica anterior de 'update-ittos'.
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
    const updatedProcessPreview = { ...process, ...updatedITTOs };

    // Actualización optimista de la UI para que el cambio sea instantáneo
    setProcess(updatedProcessPreview);
    updateProcessInState(process.id, processType, updatedProcessPreview);

    try {
      // Llamada al nuevo endpoint para crear o actualizar una personalización
      await apiClient.post('/customizations/', {
        process_id: process.id,
        process_type: processType,
        country_code: selectedCountry.code,
        ...updatedITTOs,
      });
    } catch (err) {
      console.error('Error guardando la personalización:', err);
      // Revertir en caso de fallo en la API
      setProcess(oldProcess);
      updateProcessInState(process.id, processType, oldProcess);
      alert('No se pudo guardar la personalización para este país. Inténtalo de nuevo.');
    }
  };
  // ===== FIN: NUEVA FUNCIÓN =====

  const renderContent = () => {
    if (loading)
      return (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-600">Cargando detalles del proceso...</p>
        </div>
      );
    if (error)
      return (
        <div className="flex flex-col items-center justify-center h-48 p-8">
          <p className="text-red-600 font-semibold">{error}</p>
          <button onClick={handleClose} className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md">
            Cerrar
          </button>
        </div>
      );
    if (!process) return null;

    return (
      <>
        <ModalHeader
          process={process}
          onClose={handleClose}
          onKanbanStatusChange={handleKanbanStatusChange}
          // El selector de país en el modal ya no cambia el estado, solo lo muestra.
          // El cambio real se hace desde la barra de navegación principal.
          onCountryChange={() => {}}
        />

        {/* Se pasa la nueva función de guardado a ITTOSection */}
        <ITTOSection
          process={process}
          onITTOsChange={handlePersistITTOs}
        />

        <div className="p-4 bg-gray-100 rounded-b-xl border-t text-right">
          <button
            onClick={handleClose}
            className="bg-gray-600 text-white font-bold py-2 px-6 rounded-md hover:bg-gray-700 transition duration-300"
          >
            Cerrar
          </button>
        </div>
      </>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 flex justify-center items-center p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-transform duration-300 scale-95 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {renderContent()}
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
        @keyframes fade-in-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default UnifiedProcessModal;
