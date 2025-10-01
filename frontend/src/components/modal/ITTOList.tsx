// frontend/src/components/modal/ITTOList.tsx
import React, { useState, useContext } from 'react';
import apiClient from '../../api/apiClient';
import type { AnyProcess, ITTOItem, IProcessCustomization } from '../../types/process';
import { ProcessContext } from '../../context/ProcessContext';
import ITTOListItem from './ITTOListItem';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import AddVersionModal from './AddVersionModal';
import { v4 as uuidv4 } from 'uuid';

type ListTitle = 'Entradas' | 'Herramientas y Técnicas' | 'Salidas';

const propertyMap: Record<ListTitle, keyof Pick<AnyProcess, 'inputs' | 'tools_and_techniques' | 'outputs'>> = {
  'Entradas': 'inputs',
  'Herramientas y Técnicas': 'tools_and_techniques',
  'Salidas': 'outputs',
};

interface ITTOListProps {
  title: ListTitle;
  items: ITTOItem[];                     // puede venir con huecos -> lo saneamos abajo
  icon: React.ReactNode;
  process: AnyProcess;
  setProcess: React.Dispatch<React.SetStateAction<AnyProcess | null>>;
}

const ITTOList: React.FC<ITTOListProps> = ({ title, items, icon, process, setProcess }) => {
  const { addOrUpdateCustomization } = useContext(ProcessContext);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNewItem, setIsNewItem] = useState<boolean>(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isVisible: boolean;
    itemToDelete: { id: string; name: string; parentId?: string } | null;
  }>({ isVisible: false, itemToDelete: null });

  const [addModal, setAddModal] = useState<{ isVisible: boolean; parentId: string | null; parentName: string | null }>({
    isVisible: false,
    parentId: null,
    parentName: null,
  });

  const processKey = propertyMap[title];

  const currentKanbanStatus = process.activeCustomization?.kanban_status ?? process.kanban_status;
  const isLocked = currentKanbanStatus === 'in_progress';
  // const isLocked = ['in_progress', 'in_review'].includes(currentKanbanStatus); // si quieres bloquear también revisión

  // ⚠️ Saneamos el array proveniente de props (evita undefined en map/handlers)
  const safeItems: ITTOItem[] = Array.isArray(items) ? (items as (ITTOItem | undefined)[]).filter(Boolean) as ITTOItem[] : [];

  // ---------------- Persistencia (optimista) ----------------
  const handlePersistChanges = async (updatedItems: ITTOItem[]) => {
    if (!process) return;
    if (isLocked) return; // defensa dura

    const oldProcessState = { ...process };
    const newProcessState = { ...process, [processKey]: updatedItems };
    setProcess(newProcessState);

    if (process.activeCustomization) {
      const updatedCustomization = {
        ...process.activeCustomization,
        [processKey]: updatedItems,
      };
      addOrUpdateCustomization(process.id, process.type, updatedCustomization);

      try {
        const payload = {
          process_id: process.id,
          process_type: process.type,
          country_code: process.activeCustomization.country_code,
          inputs: processKey === 'inputs' ? updatedItems : process.inputs,
          tools_and_techniques: processKey === 'tools_and_techniques' ? updatedItems : process.tools_and_techniques,
          outputs: processKey === 'outputs' ? updatedItems : process.outputs,
        };

        const response = await apiClient.post<IProcessCustomization>('/customizations/', payload);
        addOrUpdateCustomization(process.id, process.type, response.data);
        setProcess(prev => (prev ? { ...prev, activeCustomization: response.data } : null));
      } catch (error) {
        console.error(`Error saving customization for ${processKey}:`, error);
        setProcess(oldProcessState);
        if (oldProcessState.activeCustomization) {
          addOrUpdateCustomization(process.id, process.type, oldProcessState.activeCustomization);
        }
        alert(
          `No se pudieron guardar los cambios para ${title} en ${process.activeCustomization.country_code.toUpperCase()}.`
        );
      }
    } else {
      console.warn('Se intentó editar la versión base.');
      setProcess(oldProcessState);
      alert('La edición de la guía original no está permitida desde esta interfaz.');
    }
  };

  // ---------------- Handlers ----------------
  const handleSelectVersion = (parentId: string, versionId: string) => {
    if (isLocked) return;
    const updatedItems = JSON.parse(JSON.stringify(safeItems));

    const findAndProcessParent = (currentItems: ITTOItem[]): boolean => {
      for (const item of currentItems) {
        if (!item) continue;
        if (item.id === parentId) {
          if (parentId === versionId) {
            item.versions?.forEach(v => (v.isActive = false));
          } else {
            item.versions?.forEach(v => (v.isActive = v.id === versionId));
          }
          return true;
        }
        if (item.versions && findAndProcessParent(item.versions)) return true;
      }
      return false;
    };

    findAndProcessParent(updatedItems);
    handlePersistChanges(updatedItems);
  };

  const handleAddParentItemRequest = () => {
    if (isLocked) return;
    setAddModal({ isVisible: true, parentId: null, parentName: null });
  };

  const handleAddVersionRequest = (parentId: string, parentName: string) => {
    if (isLocked) return;
    setAddModal({ isVisible: true, parentId, parentName });
  };

  const handleConfirmAdd = (newName: string, newUrl: string) => {
    if (isLocked) return;
    const parentId = addModal.parentId;

    if (parentId) {
      const updatedItems = JSON.parse(JSON.stringify(safeItems));
      let itemFound = false;

      const findAndAddVersion = (item: ITTOItem) => {
        if (itemFound || !item) return;
        if (item.id === parentId) {
          const newVersion: ITTOItem = {
            id: uuidv4(),
            name: newName,
            url: newUrl,
            versions: [],
            isActive: false,
          };
          if (!item.versions) item.versions = [];
          item.versions.forEach(v => (v.isActive = false));
          newVersion.isActive = true;
          item.versions.push(newVersion);
          itemFound = true;
        } else if (item.versions?.length) {
          item.versions.forEach(findAndAddVersion);
        }
      };

      updatedItems.forEach(findAndAddVersion);
      if (itemFound) handlePersistChanges(updatedItems);
    } else {
      const newItem: ITTOItem = { id: uuidv4(), name: newName, url: newUrl, versions: [], isActive: false };
      const updatedItems = [...safeItems, newItem];
      handlePersistChanges(updatedItems);
    }

    setAddModal({ isVisible: false, parentId: null, parentName: null });
  };

  const handleSave = (itemId: string, newName: string, newUrl: string) => {
    if (isLocked) return;
    const updatedItems = JSON.parse(JSON.stringify(safeItems));

    let itemFound = false;
    const findAndUpdate = (item: ITTOItem) => {
      if (itemFound || !item) return;
      if (item.id === itemId) {
        const isKeyElement = process.type === 'scrum' && (item.name ?? '').trim().endsWith('*');
        item.name = isKeyElement ? `${newName.trim()}*` : newName.trim();
        item.url = newUrl;
        itemFound = true;
      } else if (item.versions?.length) {
        item.versions.forEach(findAndUpdate);
      }
    };

    updatedItems.forEach(findAndUpdate);
    if (itemFound) handlePersistChanges(updatedItems);

    setEditingId(null);
    setIsNewItem(false);
  };

  const handleCancel = () => {
    if (isNewItem) {
      const updatedItems = safeItems.filter(it => it?.id !== editingId);
      const updatedProcess = { ...process, [processKey]: updatedItems };
      setProcess(updatedProcess);
    }
    setEditingId(null);
    setIsNewItem(false);
  };

  const handleConfirmDelete = async () => {
    if (isLocked) return;
    if (!deleteConfirmation.itemToDelete) return;

    const targetId = deleteConfirmation.itemToDelete.id;
    const parentId = deleteConfirmation.itemToDelete.parentId;
    const updatedItems: ITTOItem[] = JSON.parse(JSON.stringify(safeItems));

    if (parentId) {
      const walk = (arr: ITTOItem[]): boolean => {
        for (const it of arr) {
          if (!it) continue;
          if (it.id === parentId && it.versions?.length) {
            const idx = it.versions.findIndex(v => v.id === targetId);
            if (idx >= 0) {
              const wasActive = !!it.versions[idx].isActive;
              it.versions.splice(idx, 1);
              if (wasActive && it.versions.length > 0) {
                const promoteIndex = Math.max(0, idx - 1);
                it.versions.forEach(v => (v.isActive = false));
                it.versions[promoteIndex].isActive = true;
              }
              return true;
            }
          }
          if (it.versions && walk(it.versions)) return true;
        }
        return false;
      };
      walk(updatedItems);
    } else {
      const promoteChildToParent = (arr: ITTOItem[]): boolean => {
        for (const it of arr) {
          if (!it) continue;
          if (it.id === targetId) {
            const children = it.versions ?? [];

            if (children.length === 0) {
              const i = arr.findIndex(x => x?.id === targetId);
              if (i >= 0) arr.splice(i, 1);
              return true;
            }

            let promoteIdx = children.findIndex(v => v.isActive);
            if (promoteIdx < 0) promoteIdx = children.length - 1;

            const promote = children[promoteIdx];
            const remaining = children.filter((_, j) => j !== promoteIdx);

            it.name = promote.name;
            it.url = promote.url;

            remaining.forEach(v => (v.isActive = false));
            it.isActive = false;
            it.versions = remaining;

            return true;
          }
          if (it.versions && promoteChildToParent(it.versions)) return true;
        }
        return false;
      };

      promoteChildToParent(updatedItems);
    }

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
          disabled={isLocked}
          className="ml-2 flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-500 rounded-full
                     hover:bg-green-500 hover:text-white transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-200 disabled:hover:text-gray-500"
          title={isLocked ? 'Bloqueado durante En Progreso' : `Añadir nuevo documento a ${title}`}
        >
          <span className="text-base font-bold leading-none -mt-px">+</span>
        </button>
      </h3>

      <div className="relative text-gray-700 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <ul>
          {safeItems.map((item) => (
            <ITTOListItem
              key={item.id}
              item={item}
              isEditing={editingId === item.id}
              processType={process.type}
              onEditStart={() => {
                if (!isLocked) {
                  setIsNewItem(false);
                  setEditingId(item.id);
                }
              }}
              onSave={handleSave}
              onCancel={handleCancel}
              onAddVersion={() => handleAddVersionRequest(item.id, (item.name ?? '').replace(/\*$/, '').trim())}
              onDeleteRequest={(id, name, parentId) => {
                if (isLocked) return;
                setDeleteConfirmation({ isVisible: true, itemToDelete: { id, name, parentId } });
              }}
              onSelectVersion={handleSelectVersion}
              isLocked={isLocked}
            />
          ))}
        </ul>

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
