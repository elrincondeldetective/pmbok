// frontend/src/components/modal/ITTOListItem.tsx
import React, { useState } from 'react';
import { FaLink, FaPencilAlt, FaPlus, FaTimes, FaEye, FaFileAlt, FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import type { ITTOItem } from '../../types/process';

interface ActionIconsProps {
    onEdit: () => void;
    onAddVersion: () => void;
    onDelete: () => void;
    onView: () => void;
    hasVersions: boolean;
}

const ActionIcons: React.FC<ActionIconsProps> = ({ onEdit, onAddVersion, onDelete, onView, hasVersions }) => (
    <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-80 transition-opacity duration-300">
        <FaPencilAlt onClick={(e) => { e.stopPropagation(); onEdit(); }} className="w-3.5 h-3.5 text-yellow-600 cursor-pointer hover:text-yellow-500" title="Editar" />
        <FaPlus onClick={(e) => { e.stopPropagation(); onAddVersion(); }} className="w-3.5 h-3.5 text-green-600 cursor-pointer hover:text-green-500" title="Añadir Versión" />
        <FaTimes onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-3.5 h-3.5 text-red-600 cursor-pointer hover:text-red-500" title="Eliminar" />
        <FaEye
            onClick={(e) => { e.stopPropagation(); if (hasVersions) onView(); }}
            className={`w-3.5 h-3.5 ${hasVersions ? 'text-blue-600 cursor-pointer hover:text-blue-500' : 'text-gray-400 cursor-not-allowed'}`}
            title={hasVersions ? "Desplegar/Ocultar Versiones" : "No hay versiones disponibles"}
        />
    </div>
);

interface EditItemFormProps {
    initialName: string;
    initialUrl: string;
    onSave: (name: string, url: string) => void;
    onCancel: () => void;
}

const EditItemForm: React.FC<EditItemFormProps> = ({ initialName, initialUrl, onSave, onCancel }) => {
    const [name, setName] = React.useState(initialName);
    const [url, setUrl] = React.useState(initialUrl);

    const handleSave = () => {
        onSave(name, url);
    };

    return (
        <div className="w-full py-1">
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-blue-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                autoFocus
                onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-2 p-3 bg-gray-100 rounded-md border animate-fade-in-down">
                <label className="text-xs font-semibold text-gray-500 block mb-1">URL del Documento (Opcional)</label>
                <input
                    type="text"
                    placeholder="https://ejemplo.com/documento"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
            <div className="flex items-center justify-end space-x-3 mt-3">
                <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md">Cancelar</button>
                <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="text-sm bg-blue-600 text-white font-bold px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors">Guardar</button>
            </div>
        </div>
    );
};


interface ITTOListItemProps {
    item: ITTOItem;
    isEditing: boolean;
    processType: 'pmbok' | 'scrum';
    onEditStart: () => void;
    onSave: (name: string, url: string) => void;
    onCancel: () => void;
    onAddVersion: () => void;
    onDeleteRequest: (id: string, name: string) => void;
    onSelectVersion: (parentId: string, versionId: string) => void;
}

const ITTOListItem: React.FC<ITTOListItemProps> = ({ item, isEditing, processType, onEditStart, onSave, onCancel, onAddVersion, onDeleteRequest, onSelectVersion }) => {
    const [showVersions, setShowVersions] = useState(false);
    const isKeyElement = processType === 'scrum' && item.name.trim().endsWith('*');
    const cleanName = item.name.replace(/\*$/, '').trim();
    const hasVersions = !!item.versions && item.versions.length > 0;

    // ===== INICIO DE LA LÓGICA CORREGIDA =====
    
    // 1. Determinar cuál es la versión activa. Si ninguna lo es, el "padre" se considera el activo.
    const activeVersion = hasVersions ? item.versions?.find(v => v.isActive) : null;
    
    // 2. El nombre y la URL a mostrar son los de la versión activa, o los del padre si no hay ninguna activa.
    // ESTO CORRIGE EL BUG DE SELECCIÓN: la UI ahora reacciona al cambio de `isActive`.
    const displayName = activeVersion ? activeVersion.name : cleanName;
    const displayUrl = activeVersion ? activeVersion.url : item.url;
    
    // 3. Crear una lista de todas las versiones seleccionables.
    // Esto incluye el documento "original" (el padre) para poder volver a seleccionarlo.
    // ESTO CORRIGE EL BUG DE "EL ORIGINAL DESAPARECE".
    const allSelectableVersions: ITTOItem[] = hasVersions ? [
        // El elemento 'padre' se trata como la versión original, es activo si ninguna otra versión lo es.
        { ...item, name: `${cleanName}`, id: item.id, isActive: !activeVersion },
        ...item.versions
    ] : [];
    // ===== FIN DE LA LÓGICA CORREGIDA =====

    const handleViewClick = () => {
        if (hasVersions) {
            setShowVersions(prev => !prev);
        }
    };

    return (
        <li className="flex flex-col justify-between py-2.5 border-b border-gray-200/80 last:border-b-0">
            <div className="flex items-center w-full group">
                {isEditing ? (
                    <EditItemForm
                        initialName={cleanName}
                        initialUrl={item.url}
                        onSave={onSave}
                        onCancel={onCancel}
                    />
                ) : (
                    <>
                        <span className="flex-grow pr-4 text-sm flex items-center">
                            {displayUrl ? (
                                <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline hover:text-blue-800 flex items-center" onClick={e => e.stopPropagation()}>
                                    {displayName}
                                    <FaLink className="w-3 h-3 ml-2 opacity-60" />
                                </a>
                            ) : (
                                <>{displayName}</>
                            )}
                            {isKeyElement && !activeVersion && <span className="text-blue-500 font-semibold ml-1" title="Elemento clave">*</span>}
                        </span>
                        <div className="flex-shrink-0">
                            <ActionIcons
                                onEdit={onEditStart}
                                onAddVersion={onAddVersion}
                                onDelete={() => onDeleteRequest(item.id, cleanName)}
                                onView={handleViewClick}
                                hasVersions={hasVersions}
                            />
                        </div>
                    </>
                )}
            </div>
            {showVersions && hasVersions && !isEditing && (
                <div className="mt-3 pl-6 pr-2 py-2 bg-gray-50 border-l-2 border-blue-200 rounded-r-md animate-fade-in-down">
                    <h4 className="text-xs font-bold text-gray-500 mb-2">Versiones del Documento:</h4>
                    <ul className="space-y-1">
                        {allSelectableVersions.map(version => (
                            <li key={version.id} className="text-sm text-gray-800 flex items-center group/version justify-between py-1">
                                <div className="flex items-center">
                                    <span
                                        className="cursor-pointer p-1 -ml-1 mr-2"
                                        // Al hacer clic, usamos el ID del padre (item.id) y el ID de la versión que estamos clickeando.
                                        // Para el original, `version.id` será igual a `item.id`.
                                        onClick={(e) => { e.stopPropagation(); onSelectVersion(item.id, version.id); }}
                                    >
                                        {version.isActive ? (
                                            <FaCheckCircle className="w-4 h-4 text-green-500" title="Versión activa" />
                                        ) : (
                                            <FaRegCircle className="w-4 h-4 text-gray-400 group-hover/version:text-green-500 transition-colors" title="Activar esta versión" />
                                        )}
                                    </span>
                                    <FaFileAlt className="w-3 h-3 mr-2 text-gray-400 flex-shrink-0" />
                                    {version.url ? (
                                        <a href={version.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center" onClick={e => e.stopPropagation()}>
                                            {version.name.replace(/\*$/, '').trim()}
                                            <FaLink className="w-2.5 h-2.5 ml-1.5 opacity-50" />
                                        </a>
                                    ) : (
                                        version.name.replace(/\*$/, '').trim()
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </li>
    );
};

export default ITTOListItem;

