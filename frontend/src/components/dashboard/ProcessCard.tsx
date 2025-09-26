// frontend/src/components/dashboard/ProcessCard.tsx
import React from 'react';
import type { IProcess } from '../../types/process';

interface ProcessCardProps {
    process: IProcess;
}

const ProcessCard: React.FC<ProcessCardProps> = ({ process }) => {
    return (
        <div className="bg-white rounded-lg shadow-lg flex flex-col transform hover:-translate-y-1 transition-transform duration-300">
            <div
                className={`p-4 rounded-t-lg ${process.status ? `${process.status.tailwind_bg_color} ${process.status.tailwind_text_color}` : 'bg-gray-500 text-white'}`}
            >
                <h2 className="font-bold text-lg">{process.process_number}. {process.name}</h2>
            </div>

            <div className="p-6 flex-grow space-y-4">
                {process.inputs && <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Entradas</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                        {process.inputs.split('\n').map((item, index) => item && <li key={index}>{item}</li>)}
                    </ul>
                </div>}

                {process.tools_and_techniques && <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Herramientas y Técnicas</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                        {process.tools_and_techniques.split('\n').map((item, index) => item && <li key={index}>{item}</li>)}
                    </ul>
                </div>}

                {process.outputs && <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Salidas</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                        {process.outputs.split('\n').map((item, index) => item && <li key={index}>{item}</li>)}
                    </ul>
                </div>}
            </div>

            <div className={`border-t p-4 rounded-b-lg mt-auto text-center ${process.stage ? `${process.stage.tailwind_bg_color} ${process.stage.tailwind_text_color}` : 'bg-gray-200 text-gray-700'}`}>
                <p className="text-xs font-bold uppercase tracking-wider">
                    {process.stage ? process.stage.name : 'Etapa no definida'}
                </p>
            </div>
        </div>
    );
};

export default ProcessCard;
