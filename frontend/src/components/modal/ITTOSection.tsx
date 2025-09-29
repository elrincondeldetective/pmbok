// frontend/src/components/modal/ITTOSection.tsx
import React from 'react';
import { FaSignInAlt, FaTools, FaSignOutAlt, FaInfoCircle } from 'react-icons/fa';
import type { AnyProcess, IPMBOKProcess, IScrumProcess } from '../../types/process';
import ITTOList from './ITTOList';

interface ITTOSectionProps {
    process: AnyProcess;
    setProcess: React.Dispatch<React.SetStateAction<AnyProcess | null>>;
    apiEndpoint: string;
}

const ITTOSection: React.FC<ITTOSectionProps> = ({ process, setProcess, apiEndpoint }) => {
    const isPmbok = process.type === 'pmbok';
    const frameworkName = isPmbok ? 'PMBOK® 6' : 'SCRUM GUIDE';

    return (
        <div className="p-8 overflow-y-auto space-y-8 bg-gray-50">
            <div>
                <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-3">
                    <FaInfoCircle className="text-gray-500" />
                    <span className="ml-2">Resumen del Proceso ({frameworkName})</span>
                </h3>
                {isPmbok ? (
                    <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400 shadow-sm text-sm">
                        Este proceso documenta formalmente el proyecto. El <strong>{(process as IPMBOKProcess).outputs[0]?.name.toLowerCase() || 'resultado'}</strong> resultante otorga la autoridad para aplicar recursos.
                    </p>
                ) : (
                    <p className="text-gray-700 bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400 shadow-sm text-sm">
                        Este proceso es parte del marco de trabajo Scrum, enfocado en la <strong>colaboración, adaptación e inspección continua</strong> para entregar valor.
                    </p>
                )}
            </div>

            <ITTOList
                title="Entradas"
                items={process.inputs}
                icon={<FaSignInAlt className="text-blue-500" />}
                process={process}
                setProcess={setProcess}
                apiEndpoint={apiEndpoint}
            />
            <ITTOList
                title="Herramientas y Técnicas"
                items={process.tools_and_techniques}
                icon={<FaTools className="text-amber-500" />}
                process={process}
                setProcess={setProcess}
                apiEndpoint={apiEndpoint}
            />
            <ITTOList
                title="Salidas"
                items={process.outputs}
                icon={<FaSignOutAlt className="text-green-500" />}
                process={process}
                setProcess={setProcess}
                apiEndpoint={apiEndpoint}
            />
        </div>
    );
};

export default ITTOSection;

