// frontend/src/components/Dashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Limpiamos los tokens de localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Redirigimos al login
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-md">
                <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Panel de Proyectos</h1>
                    <button 
                        onClick={handleLogout}
                        className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition duration-300"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </nav>
            <main>
                {/* AQUÍ PUEDES PEGAR EL CONTENIDO DE TU index.html 
                  Debes convertir el HTML a sintaxis JSX (por ejemplo, `class` se convierte en `className`).
                  Este es un ejemplo de cómo empezar:
                */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <header className="mb-8">
                            <h1 className="text-xl font-bold">Guía PMBOK 6 - 49 procesos, entradas, herramientas y salidas</h1>
                        </header>
                        <hr className="border-gray-300" />
                        <main className="my-16 space-y-4">
                            <p><a href="#" className="text-lg text-gray-600 hover:text-blue-600 underline">Ver por grupo de procesos</a></p>
                            <p><a href="#" className="text-lg text-gray-600 hover:text-blue-600 underline">Ver por área de conocimiento</a></p>
                            <p><a href="#" className="text-lg text-gray-600 hover:text-blue-600 underline">Scrum Cards</a></p>
                        </main>
                        {/* ... y así sucesivamente con el resto del contenido de index.html */}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;

