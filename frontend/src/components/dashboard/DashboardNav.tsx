// frontend/src/components/dashboard/DashboardNav.tsx
import React from 'react';

interface DashboardNavProps {
    onLogout: () => void;
}

const DashboardNav: React.FC<DashboardNavProps> = ({ onLogout }) => {
    return (
        <nav className="bg-white shadow-md sticky top-0 z-10">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">Panel de Procesos PMBOK</h1>
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
