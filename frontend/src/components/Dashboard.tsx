// frontend/src/components/Dashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNav from './dashboard/DashboardNav.tsx'; // Ruta corregida
import HybridView from './HybridView.tsx'; // Ruta corregida

const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <DashboardNav onLogout={handleLogout} />
            <main>
                {/* 👇 REEMPLAZAMOS TODO EL CONTENIDO ANTERIOR POR LA VISTA HÍBRIDA */}
                <HybridView />
            </main>
        </div>
    );
};

export default Dashboard;

