// frontend/src/components/modal/DeleteConfirmationModal.tsx
import React from 'react';

interface DeleteConfirmationModalProps {
    isVisible: boolean;
    itemToDelete: { id: string; name: string } | null;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isVisible, itemToDelete, onClose, onConfirm }) => {
    if (!isVisible) return null;

    return (
        <div
            className="absolute inset-0 bg-black/40 z-50 flex justify-center items-center p-4 animate-fade-in rounded-xl"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-md animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="text-center">
                        <svg className="mx-auto mb-4 text-yellow-400 w-12 h-12" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <h3 className="mb-2 text-lg font-semibold text-gray-800">Aviso Importante</h3>
                        <p className="mb-5 text-sm text-gray-600">
                            No es recomendable borrar documentos. Es mejor que inicies otro y dejes este para consultas futuras.
                        </p>
                        <p className="mb-6 text-sm text-gray-500 bg-gray-100 p-2 rounded-md truncate">
                            Documento: <strong className="font-medium text-gray-800" title={itemToDelete?.name}>{itemToDelete?.name}</strong>
                        </p>
                    </div>
                    <div className="flex justify-center items-center space-x-4">
                        <button
                            onClick={onClose}
                            type="button"
                            className="py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            type="button"
                            className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                        >
                            Confirmar Borrado
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;

