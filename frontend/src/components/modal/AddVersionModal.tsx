// frontend/src/components/modal/AddVersionModal.tsx
import React, { useState, useEffect } from 'react';

interface AddVersionModalProps {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: (name: string) => void;
    parentName: string | null; // Nombre del documento padre para pre-rellenar el campo
}

/**
 * Un modal elegante y reutilizable para solicitar al usuario el nombre
 * de un nuevo documento o una nueva versión de un documento existente.
 * Mantiene la consistencia de estilo con el modal de confirmación de borrado.
 */
const AddVersionModal: React.FC<AddVersionModalProps> = ({ isVisible, onClose, onConfirm, parentName }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        // Pre-rellena el campo de texto si se está creando una versión
        if (isVisible && parentName) {
            setName(`Versión de "${parentName}"`);
        } else if (isVisible) {
            setName(''); // Limpia el campo si se crea un nuevo documento padre
        }
    }, [isVisible, parentName]);


    if (!isVisible) return null;

    const handleConfirm = () => {
        if (name.trim()) {
            onConfirm(name.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-md animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="text-center">
                         {/* Icono de "Añadir" */}
                         <svg className="mx-auto mb-4 text-blue-500 w-12 h-12" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 5.757v8.486M5.757 10h8.486M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                        <h3 className="mb-2 text-lg font-semibold text-gray-800">
                            {parentName ? 'Añadir Nueva Versión' : 'Añadir Nuevo Documento'}
                        </h3>
                        <p className="mb-5 text-sm text-gray-600">
                           Ingresa un nombre descriptivo.
                        </p>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Nombre del documento..."
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-center items-center space-x-4 mt-6">
                        <button
                            onClick={onClose}
                            type="button"
                            className="py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            type="button"
                            className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddVersionModal;

