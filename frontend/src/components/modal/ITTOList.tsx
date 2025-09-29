// frontend/src/components/modal/ITTOList.tsx
import React, { useState, useContext } from 'react';
import apiClient from '../../api/apiClient';
import type { AnyProcess, ITTOItem } from '../../types/process';
import { ProcessContext } from '../../context/ProcessContext';
import ITTOListItem from './ITTOListItem';
import DeleteConfirmationModal from './DeleteConfirmationModal';

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
    
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isNewItem, setIsNewItem] = useState<boolean>(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isVisible: boolean; itemToDelete: { id: string; name: string } | null; }>({ isVisible: false, itemToDelete: null });

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
    
    const handleAddItem = () => {
        const newItem: ITTOItem = { name: 'Nuevo Documento', url: '' };
        const updatedItems = [...items, newItem];
        
        const updatedProcess = { ...process, [processKey]: updatedItems };
        setProcess(updatedProcess);

        setIsNewItem(true);
        setEditingIndex(updatedItems.length - 1);
    };

    const handleSave = (index: number, newName: string, newUrl: string) => {
        const updatedItems = [...items];
        const originalItem = updatedItems[index];
        const isKeyElement = process.type === 'scrum' && originalItem?.name.trim().endsWith('*');
        
        updatedItems[index] = {
            name: isKeyElement ? `${newName.trim()}*` : newName.trim(),
            url: newUrl,
        };
        
        handlePersistChanges(updatedItems);
        
        setEditingIndex(null);
        setIsNewItem(false);
    };

    const handleCancel = () => {
        if (isNewItem) {
            const updatedItems = items.slice(0, -1);
            const updatedProcess = { ...process, [processKey]: updatedItems };
            setProcess(updatedProcess);
        }
        setEditingIndex(null);
        setIsNewItem(false);
    };
    
    const handleConfirmDelete = async () => {
        if (!deleteConfirmation.itemToDelete) return;
        const [_, indexStr] = deleteConfirmation.itemToDelete.id.split(/-(?=\d+$)/);
        const index = parseInt(indexStr, 10);
        
        const updatedItems = items.filter((_, i) => i !== index);
        await handlePersistChanges(updatedItems);
        setDeleteConfirmation({ isVisible: false, itemToDelete: null });
    };

    return (
        <div>
            <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-3">
                {icon}
                <span className="ml-2">{title}</span>
            </h3>
            <ul className="text-gray-700 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                {items.map((item, index) => (
                    <ITTOListItem
                        key={index}
                        item={item}
                        isEditing={editingIndex === index}
                        processType={process.type}
                        onEditStart={() => { setIsNewItem(false); setEditingIndex(index); }}
                        onSave={(name, url) => handleSave(index, name, url)}
                        onCancel={handleCancel}
                        onAdd={handleAddItem}
                        onDelete={() => {
                            const cleanName = item.name.replace(/\*$/, '').trim();
                            setDeleteConfirmation({ isVisible: true, itemToDelete: { id: `${title}-${index}`, name: cleanName } });
                        }}
                    />
                ))}
            </ul>

            <DeleteConfirmationModal
                isVisible={deleteConfirmation.isVisible}
                itemToDelete={deleteConfirmation.itemToDelete}
                onClose={() => setDeleteConfirmation({ isVisible: false, itemToDelete: null })}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};

export default ITTOList;

