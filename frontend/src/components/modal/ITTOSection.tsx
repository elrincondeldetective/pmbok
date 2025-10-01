// frontend/src/components/modal/ITTOSection.tsx
import React from 'react';
import { FaSignInAlt, FaTools, FaSignOutAlt, FaInfoCircle } from 'react-icons/fa';
import type { AnyProcess, IPMBOKProcess } from '../../types/process';
import ITTOList from './ITTOList';
import { countryMap } from '../../data/countries'; // 👈 Se importa el mapa de países

interface ITTOSectionProps {
    process: AnyProcess;
    setProcess: React.Dispatch<React.SetStateAction<AnyProcess | null>>;
    apiEndpoint: string;
}

const ITTOSection: React.FC<ITTOSectionProps> = ({ process, setProcess, apiEndpoint }) => {
    const isPmbok = process.type === 'pmbok';
    const frameworkName = isPmbok ? 'PMBOK® 6' : 'SCRUM GUIDE';

    // Obtiene los datos de la personalización activa para mostrar el país
    const activeCustomization = process.activeCustomization;
    const countryName = activeCustomization ? countryMap.get(activeCustomization.country_code) : null;

    return (
        <div className="p-8 overflow-y-auto space-y-8 bg-gray-50">
            <div>
                <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-3">
                    <FaInfoCircle className="text-gray-500" />
                    <span className="ml-2">Resumen del Proceso ({frameworkName})</span>
                </h3>

                {/* Esta sección muestra la bandera y nombre del país si hay una personalización activa */}
                {activeCustomization && countryName && (
                    <div className="my-4 p-3 bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-3 animate-fade-in-down">
                        <img
                            src={`https://flagcdn.com/w40/${activeCustomization.country_code.toLowerCase()}.png`}
                            width="40"
                            alt={`Bandera de ${countryName}`}
                            className="rounded shadow-md"
                        />
                        <div>
                            <p className="text-xs text-gray-500 font-semibold">Mostrando versión para:</p>
                            <p className="font-bold text-gray-800">{countryName}</p>
                        </div>
                    </div>
                )}

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
