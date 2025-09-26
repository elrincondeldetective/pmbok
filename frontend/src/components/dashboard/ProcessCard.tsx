// frontend/src/components/dashboard/ProcessCard.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { IProcess } from '../../types/process';

interface ProcessCardProps {
    process: IProcess;
}

const ProcessCard: React.FC<ProcessCardProps> = ({ process }) => {
    const location = useLocation();

    return (
        <Link 
            to={`/process/${process.id}`} 
            state={{ background: location }}
            className="block"
        >
            <div className="bg-white rounded-lg shadow-lg flex flex-col h-full transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
                <div
                    className={`p-4 rounded-t-lg ${process.status ? `${process.status.tailwind_bg_color} ${process.status.tailwind_text_color}` : 'bg-gray-500 text-white'}`}
                >
                    <h2 className="font-bold text-lg leading-tight">{process.process_number}. {process.name}</h2>
                </div>

                {/* ----- CORRECCIÓN 2: Espaciado de las tarjetas ----- */}
                {/* Se cambió 'p-4' por 'p-6' y 'space-y-3' por 'space-y-4' para más aire. */}
                <div className="p-6 flex-grow flex flex-col space-y-4">
                    {process.inputs && <div>
                        {/* Se aumentó el margen inferior de mb-1 a mb-2 */}
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Entradas</h3>
                        {/* Se aumentó el espaciado entre items de space-y-1 a space-y-2 */}
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

                {/* Se restauró el padding de p-3 a p-4 para consistencia */}
                <div className={`border-t p-4 rounded-b-lg mt-auto text-center ${process.stage ? `${process.stage.tailwind_bg_color} ${process.stage.tailwind_text_color}` : 'bg-gray-200 text-gray-700'}`}>
                    <p className="text-xs font-bold uppercase tracking-wider">
                        {process.stage ? process.stage.name : 'Etapa no definida'}
                    </p>
                </div>
            </div>
        </Link>
    );
};

export default ProcessCard;
