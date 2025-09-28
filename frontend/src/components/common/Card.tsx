// frontend/src/components/common/Card.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { AnyProcess, IPMBOKProcess, IScrumProcess } from '../../types/process';

interface CardProps {
  process: AnyProcess;
  framework: 'pmbok' | 'scrum';
}

// Función para verificar si el proceso es de tipo PMBOK
function isPMBOKProcess(process: AnyProcess): process is IPMBOKProcess {
    return 'kanban_status' in process;
}


const Card: React.FC<CardProps> = ({ process, framework }) => {
    const location = useLocation();

    const linkTarget = isPMBOKProcess(process) ? `/process/${process.id}` : '#';

    // CAMBIO: Determinar el grupo (Etapa o Fase) y sus propiedades de forma condicional
    const group = isPMBOKProcess(process) ? process.stage : (process as IScrumProcess).phase;
    const groupBgColor = group?.tailwind_bg_color || 'bg-gray-200';
    const groupTextColor = group?.tailwind_text_color || 'text-gray-700';
    const groupName = group?.name || 'No definida';


    const cardContent = (
        <div className="bg-white rounded-lg shadow-lg flex flex-col h-full transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
            <div
                className={`p-4 rounded-t-lg ${process.status ? `${process.status.tailwind_bg_color} ${process.status.tailwind_text_color}` : 'bg-gray-500 text-white'}`}
            >
                <h2 className="font-bold text-lg leading-tight">{process.process_number}. {process.name}</h2>
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

            {/* CAMBIO: Usar las variables condicionales para el pie de la tarjeta */}
            <div className={`border-t p-4 rounded-b-lg mt-auto text-center ${groupBgColor} ${groupTextColor}`}>
                <p className="text-xs font-bold uppercase tracking-wider">
                    {groupName}
                </p>
            </div>
        </div>
    );
    
    // Si es PMBOK, envolvemos la tarjeta en un Link para abrir el modal
    if (framework === 'pmbok') {
        return (
            <Link
                to={linkTarget}
                state={{ background: location }}
                className="block"
            >
                {cardContent}
            </Link>
        )
    }

    // Si es Scrum, simplemente mostramos la tarjeta sin enlace
    return cardContent;
};

export default Card;
