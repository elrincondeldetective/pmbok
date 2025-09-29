// frontend/src/components/modal/ITTOList.tsx
import React, { useState, useContext } from 'react';
import apiClient from '../../api/apiClient';
import type { AnyProcess, ITTOItem } from '../../types/process';
import { ProcessContext } from '../../context/ProcessContext';
import ITTOListItem from './ITTOListItem';
import DeleteConfirmationModal from './DeleteConfirmationModal';
// ===== INICIO: CAMBIO SOLICITADO =====
// 1. Importar el nuevo modal para añadir documentos o versiones.
import AddVersionModal from './AddVersionModal';
// ===== FIN: CAMBIO SOLICITADO =====
import { v4 as uuidv4 } from 'uuid';

type ListTitle = 'Entradas' | 'Herramientas y Técnicas' | 'Salidas';

const propertyMap: Record<ListTitle, keyof Pick<AnyProcess, 'inputs' | 'tools_and_techniques' | 'outputs'>> = {
    'Entradas': 'inputs',
    'Herramientas y Técnicas': 'tools_and_techniques',
    'Salidas': 'outputs'
};

interface ITTOListProps {
    title: ListTitle;
    items: ITTOItem[];
    icon: React.ReactNode;
    process: AnyProcess;
    setProcess: React.Dispatch<React.SetStateAction<AnyProcess | null>>;
    apiEndpoint: string;
}

const ITTOList: React.FC<ITTOListProps> = ({ title, items, icon, process, setProcess, apiEndpoint }) => {
    const { updateProcessInState } = useContext(ProcessContext);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [isNewItem, setIsNewItem] = useState<boolean>(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isVisible: boolean; itemToDelete: { id: string; name: string } | null; }>({ isVisible: false, itemToDelete: null });

    // ===== INICIO: CAMBIO SOLICITADO =====
    // 2. Añadir un estado para controlar el modal de "añadir".
    //    Guardará la visibilidad y el ID/nombre del documento padre si aplica.
    const [addModal, setAddModal] = useState<{ isVisible: boolean; parentId: string | null; parentName: string | null }>({ isVisible: false, parentId: null, parentName: null });
    // ===== FIN: CAMBIO SOLICITADO =====

    const processKey = propertyMap[title];

    const handlePersistChanges = async (updatedItems: ITTOItem[]) => {
        const oldProcess = { ...process };
        const updatedProcess = { ...process, [processKey]: updatedItems };

        setProcess(updatedProcess);
        updateProcessInState(process.id, process.type, updatedProcess);

        try {
            await apiClient.patch(`/${apiEndpoint}/${process.id}/update-ittos/`, { [processKey]: updatedItems });
        } catch (error) {
            console.error(`Error updating ${processKey}:`, error);
            setProcess(oldProcess);
            updateProcessInState(oldProcess.id, oldProcess.type, oldProcess);
            alert(`No se pudieron guardar los cambios en ${title}.`);
        }
    };

    // 3. Modificar los handlers para que usen el modal.
    const handleAddParentItemRequest = () => {
        // Abre el modal para crear un nuevo documento padre (sin parentId).
        setAddModal({ isVisible: true, parentId: null, parentName: null });
    };

    const handleAddVersionRequest = (parentId: string, parentName: string) => {
        // Abre el modal para crear una versión hija, pasando los datos del padre.
        setAddModal({ isVisible: true, parentId: parentId, parentName: parentName });
    };

    // 4. Crear una función que se ejecutará al confirmar el modal.
    const handleConfirmAdd = (newName: string) => {
        const parentId = addModal.parentId;

        if (parentId) {
             // Lógica para añadir una VERSIÓN a un documento existente.
            const updatedItems = JSON.parse(JSON.stringify(items));
            let itemFound = false;

            const findAndAddVersion = (item: ITTOItem) => {
                if (itemFound) return;
                if (item.id === parentId) {
                    const newVersion: ITTOItem = { id: uuidv4(), name: newName, url: '', versions: [] };
                    if (!item.versions) item.versions = [];
                    item.versions.push(newVersion);
                    itemFound = true;
                } else if (item.versions) {
                    item.versions.forEach(findAndAddVersion);
                }
            };
            updatedItems.forEach(findAndAddVersion);
             if (itemFound) {
                handlePersistChanges(updatedItems);
            }
        } else {
             // Lógica para añadir un nuevo DOCUMENTO PADRE.
             const newItem: ITTOItem = { id: uuidv4(), name: newName, url: '', versions: [] };
             const updatedItems = [...items, newItem];
             handlePersistChanges(updatedItems);
        }

        // 5. Cerrar el modal después de la operación.
        setAddModal({ isVisible: false, parentId: null, parentName: null });
    };


    const handleSave = (itemId: string, newName: string, newUrl: string) => {
        const updatedItems = JSON.parse(JSON.stringify(items));

        let itemFound = false;
        const findAndUpdate = (item: ITTOItem) => {
            if (itemFound) return;
            if (item.id === itemId) {
                const isKeyElement = process.type === 'scrum' && item.name.trim().endsWith('*');
                item.name = isKeyElement ? `${newName.trim()}*` : newName.trim();
                item.url = newUrl;
                itemFound = true;
            } else if (item.versions) {
                 item.versions.forEach(findAndUpdate);
            }
        };

        updatedItems.forEach(findAndUpdate);

        if (itemFound) {
            handlePersistChanges(updatedItems);
        }

        setEditingId(null);
        setIsNewItem(false);
    };

    const handleCancel = () => {
        if (isNewItem) {
            const updatedItems = items.filter(item => item.id !== editingId);
            const updatedProcess = { ...process, [processKey]: updatedItems };
            setProcess(updatedProcess);
        }
        setEditingId(null);
        setIsNewItem(false);
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmation.itemToDelete) return;
        
        const itemIdToDelete = deleteConfirmation.itemToDelete.id;
        let updatedItems = JSON.parse(JSON.stringify(items));

        const filterOutItem = (items: ITTOItem[]): ITTOItem[] => {
            return items.filter(item => {
                if (item.id === itemIdToDelete) {
                    return false;
                }
                if (item.versions) {
                    item.versions = filterOutItem(item.versions);
                }
                return true;
            });
        };

        updatedItems = filterOutItem(updatedItems);

        await handlePersistChanges(updatedItems);
        setDeleteConfirmation({ isVisible: false, itemToDelete: null });
    };

    return (
        <div>
            <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-3">
                {icon}
                <span className="ml-2">{title}</span>
                <button
                    onClick={handleAddParentItemRequest}
                    className="ml-2 flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-500 rounded-full hover:bg-green-500 hover:text-white transition-all duration-200"
                    title={`Añadir nuevo documento a ${title}`}
                >
                    <span className="text-base font-bold leading-none -mt-px">+</span>
                </button>
            </h3>
            <div className="relative text-gray-700 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <ul>
                    {items.map((item) => (
                        <ITTOListItem
                            key={item.id}
                            item={item}
                            isEditing={editingId === item.id}
                            processType={process.type}
                            onEditStart={() => { setIsNewItem(false); setEditingId(item.id); }}
                            onSave={(name, url) => handleSave(item.id, name, url)}
                            onCancel={handleCancel}
                            // 6. Pasar la nueva función que abre el modal al item de la lista.
                            onAddVersion={() => handleAddVersionRequest(item.id, item.name.replace(/\*$/, '').trim())}
                            onDeleteRequest={(id, name) => {
                                setDeleteConfirmation({ isVisible: true, itemToDelete: { id, name } });
                            }}
                        />
                    ))}
                </ul>

                {/* 7. Renderizar el nuevo modal para añadir documentos o versiones. */}
                <AddVersionModal
                    isVisible={addModal.isVisible}
                    onClose={() => setAddModal({ isVisible: false, parentId: null, parentName: null })}
                    onConfirm={handleConfirmAdd}
                    parentName={addModal.parentName}
                />
                
                <DeleteConfirmationModal
                    isVisible={deleteConfirmation.isVisible}
                    itemToDelete={deleteConfirmation.itemToDelete}
                    onClose={() => setDeleteConfirmation({ isVisible: false, itemToDelete: null })}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </div>
    );
};

export default ITTOList;
