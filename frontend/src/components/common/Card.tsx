// frontend/src/components/common/Card.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { AnyProcess, IScrumProcess } from '../../types/process';

interface CardProps {
  process: AnyProcess;
}

const Card: React.FC<CardProps> = ({ process }) => {
    const location = useLocation();

    // === CORRECCIÓN ===
    // Se elimina la función 'isPMBOKProcess' que era incorrecta.
    // Ahora usamos directamente la propiedad 'type' que ya existe en el objeto 'process'
    // para determinar el tipo de tarjeta y generar el enlace correcto.
    const isPmbok = process.type === 'pmbok';
    const linkTarget = isPmbok ? `/process/${process.id}` : `/scrum-process/${process.id}`;
    
    // La lógica para obtener el grupo (stage o phase) también se simplifica usando 'process.type'
    const group = isPmbok ? process.stage : (process as IScrumProcess).phase;
    const groupBgColor = group?.tailwind_bg_color || 'bg-gray-200';
    const groupTextColor = group?.tailwind_text_color || 'text-gray-700';
    const groupName = group?.name || 'No definida';

    return (
        <Link
            to={linkTarget}
            state={{ background: location }}
            className="block"
        >
            <div className="bg-white rounded-lg shadow-lg flex flex-col h-full transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
                <div
                    className={`p-4 rounded-t-lg ${process.status ? `${process.status.tailwind_bg_color} ${process.status.tailwind_text_color}` : 'bg-gray-500 text-white'}`}
                >
                    <h2 className="font-bold text-lg leading-tight">{process.process_number}. {process.name}</h2>
                    {/* ===== INICIO: CAMBIO SOLICITADO ===== */}
                    {/* Se añade un indicador visual para diferenciar entre PMBOK y Scrum. */}
                    <div className="mt-2">
                        <span className="inline-block bg-white/25 text-white/95 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                            {isPmbok ? 'PMBOK® 6' : 'SCRUM GUIDE'}
                        </span>
                    </div>
                    {/* ===== FIN: CAMBIO SOLICITADO ===== */}
                </div>

                <div className="p-6 flex-grow flex flex-col space-y-4">
                    {process.inputs && <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Entradas</h3>
                        <ul className="list-disc list-inside text-sm space-y-2 text-gray-700">
                            {process.inputs.split('\n').map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
                        </ul>
                    </div>}

                    {process.tools_and_techniques && <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Herramientas y Técnicas</h3>
                        <ul className="list-disc list-inside text-sm space-y-2 text-gray-700">
                            {process.tools_and_techniques.split('\n').map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
                        </ul>
                    </div>}

                    {process.outputs && <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Salidas</h3>
                        <ul className="list-disc list-inside text-sm space-y-2 text-gray-700">
                            {process.outputs.split('\n').map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
                        </ul>
                    </div>}
                </div>

                <div className={`border-t p-4 rounded-b-lg mt-auto text-center ${groupBgColor} ${groupTextColor}`}>
                    <p className="text-xs font-bold uppercase tracking-wider">
                        {groupName}
                    </p>
                </div>
            </div>
        </Link>
    );
};

export default Card;
