// frontend/src/components/common/ActionIcons.tsx
import React from 'react';
// CORRECCIÓN: Se importa FaXmark en lugar de FaTimes.
import { FaPencil, FaPlus, FaXmark, FaEye } from 'react-icons/fa6';

const ActionIcons: React.FC = () => {
    return (
        <div className="flex items-center space-x-3">
            <FaPencil className="w-3.5 h-3.5 text-yellow-600/90" title="Editar" />
            <FaPlus className="w-3.5 h-3.5 text-green-600/90" title="Añadir" />
            {/* CORRECCIÓN: Se usa el componente FaXmark. */}
            <FaXmark className="w-3.5 h-3.5 text-red-600/90" title="Eliminar" />
            <FaEye className="w-3.5 h-3.5 text-blue-600/90" title="Ver" />
        </div>
    );
};

export default ActionIcons;
