// frontend/src/components/modal/ITTOListItem.tsx
import React, { useState } from 'react';
import { FaLink, FaPencilAlt, FaPlus, FaTimes, FaEye } from 'react-icons/fa';
import type { ITTOItem } from '../../types/process';

interface ActionIconsProps {
    onEdit: () => void;
    onAdd: () => void;
    onDelete: () => void;
    onView: () => void;
    hasUrl: boolean;
}

const ActionIcons: React.FC<ActionIconsProps> = ({ onEdit, onAdd, onDelete, onView, hasUrl }) => (
    <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-80 transition-opacity duration-300">
        <FaPencilAlt onClick={(e) => { e.stopPropagation(); onEdit(); }} className="w-3.5 h-3.5 text-yellow-600 cursor-pointer hover:text-yellow-500" title="Editar" />
        <FaPlus onClick={(e) => { e.stopPropagation(); onAdd(); }} className="w-3.5 h-3.5 text-green-600 cursor-pointer hover:text-green-500" title="Añadir" />
        <FaTimes onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-3.5 h-3.5 text-red-600 cursor-pointer hover:text-red-500" title="Eliminar" />
        <FaEye 
            onClick={(e) => { e.stopPropagation(); if (hasUrl) onView(); }} 
            className={`w-3.5 h-3.5 ${hasUrl ? 'text-blue-600 cursor-pointer hover:text-blue-500' : 'text-gray-400 cursor-not-allowed'}`} 
            title={hasUrl ? "Desplegar/Ocultar URL" : "No hay URL disponible"} 
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
    onAdd: () => void;
    onDelete: () => void;
}

const ITTOListItem: React.FC<ITTOListItemProps> = ({ item, isEditing, processType, onEditStart, onSave, onCancel, onAdd, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isKeyElement = processType === 'scrum' && item.name.trim().endsWith('*');
    const cleanName = item.name.replace(/\*$/, '').trim();
    const hasUrl = !!item.url;

    const handleView = () => {
        if (hasUrl) {
            setIsExpanded(prev => !prev);
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
                            {item.url ? (
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline hover:text-blue-800 flex items-center" onClick={e => e.stopPropagation()}>
                                    {cleanName}
                                    <FaLink className="w-3 h-3 ml-2 opacity-60" />
                                </a>
                            ) : (
                                cleanName
                            )}
                            {isKeyElement && <span className="text-blue-500 font-semibold ml-1" title="Elemento clave">*</span>}
                        </span>
                        <div className="flex-shrink-0">
                            <ActionIcons
                                onEdit={onEditStart}
                                onAdd={onAdd}
                                onDelete={onDelete}
                                onView={handleView}
                                hasUrl={hasUrl}
                            />
                        </div>
                    </>
                )}
            </div>
            {isExpanded && hasUrl && !isEditing && (
                 <div className="mt-2 ml-4 p-2 bg-gray-100 rounded-md border text-xs text-gray-600 w-auto self-start animate-fade-in-down break-all">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {item.url}
                    </a>
                </div>
            )}
        </li>
    );
};

export default ITTOListItem;

