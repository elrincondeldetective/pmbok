// frontend/src/components/dashboard/DashboardNav.tsx
import React, { useContext } from 'react';
import { ProcessContext } from '../../context/ProcessContext';
import GlobalCountrySelector from '../common/GlobalCountrySelector'; // Importar el nuevo componente

interface DashboardNavProps {
    onLogout: () => void;
}

const DashboardNav: React.FC<DashboardNavProps> = ({ onLogout }) => {
    const { selectedCountry, setSelectedCountry } = useContext(ProcessContext);

    return (
        <nav className="bg-white shadow-md sticky top-0 z-20 border-b">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">Panel de Procesos</h1>
                <div className="absolute left-1/2 -translate-x-1/2">
                    {/* Usar el nuevo selector global */}
                    <GlobalCountrySelector
                        value={selectedCountry?.code || null}
                        onChange={(country) => setSelectedCountry(country)}
                        allowClear={false}
                    />
                </div>
                <button
                    onClick={onLogout}
                    className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition duration-300"
                >
                    Cerrar Sesión
                </button>
            </div>
        </nav>
    );
};

export default DashboardNav;


