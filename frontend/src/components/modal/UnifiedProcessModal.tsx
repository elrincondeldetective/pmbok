// frontend/src/components/modal/UnifiedProcessModal.tsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import type { KanbanStatus } from '../../types/process';
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

        // Optimistic UI Update
        setProcess(updatedProcessPreview);
        updateProcessInState(process.id, processType, updatedProcessPreview);

        // API Call
        try {
            await apiClient.patch(`/${apiEndpoint}/${process.id}/update-kanban-status/`, {
                kanban_status: newStatus
            });
        } catch (error) {
            console.error("Error updating Kanban status:", error);
            // Rollback on failure
            setProcess(oldProcess);
            updateProcessInState(process.id, processType, oldProcess);
            alert("No se pudo actualizar el estado. Por favor, inténtalo de nuevo.");
        }
    };

    const renderContent = () => {
        if (loading) return <div className="flex items-center justify-center h-48"><p className="text-gray-600">Cargando detalles del proceso...</p></div>;
        if (error) return (
            <div className="flex flex-col items-center justify-center h-48 p-8">
                <p className="text-red-600 font-semibold">{error}</p>
                <button onClick={handleClose} className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md">Cerrar</button>
            </div>
        );
        if (!process) return null;

        return (
            <>
                <ModalHeader 
                    process={process} 
                    onClose={handleClose}
                    onKanbanStatusChange={handleKanbanStatusChange} 
                />
                
                <ITTOSection 
                    process={process}
                    setProcess={setProcess}
                    apiEndpoint={apiEndpoint}
                />

                <div className="p-4 bg-gray-100 rounded-b-xl border-t text-right">
                    <button onClick={handleClose} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-md hover:bg-gray-700 transition duration-300">
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

