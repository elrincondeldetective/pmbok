// frontend/src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Definimos los tipos de datos que esperamos de la API
interface IProcessState {
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}

interface IProcess {
    id: number;
    process_number: number;
    name: string;
    state: IProcessState | null;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [processes, setProcesses] = useState<IProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get('http://127.0.0.1:8000/api/pmbok-processes/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setProcesses(response.data);
            } catch (err) {
                console.error("Error fetching processes:", err);
                setError("No se pudieron cargar los procesos. Intenta recargar la página.");
            } finally {
                setLoading(false);
            }
        };

        fetchProcesses();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando procesos...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-md">
                <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Panel de Procesos PMBOK</h1>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition duration-300"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </nav>
            <main>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                     <header className="mb-8 text-center">
                        <h1 className="text-2xl font-bold text-gray-800">Guía PMBOK 6ª Edición - 49 Procesos en un Entorno Ágil</h1>
                     </header>
                    
                    {/* Grid dinámico para las tarjetas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                        {processes.map((process) => (
                            <div key={process.id} className="bg-white rounded-lg shadow-lg flex flex-col">
                                <div 
                                    className={`p-4 rounded-t-lg ${process.state ? `${process.state.tailwind_bg_color} ${process.state.tailwind_text_color}` : 'bg-gray-500 text-white'}`}
                                >
                                    <h2 className="font-bold text-lg">{process.process_number}. {process.name}</h2>
                                </div>
                                <div className="p-6 flex-grow">
                                    {/* Aquí podrías agregar más detalles si los tuvieras en el modelo, como Entradas, Herramientas, etc. */}
                                    <p className="text-sm text-gray-600">
                                       Estado: <span className="font-semibold">{process.state ? process.state.name : 'No definido'}</span>
                                    </p>
                                </div>
                                <div className="bg-gray-50 border-t border-gray-200 p-4 rounded-b-lg">
                                    {/* Aquí podrías mostrar el área de conocimiento si la añades al modelo */}
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Detalles del Proceso</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;