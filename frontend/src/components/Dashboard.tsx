// frontend/src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient'; // Usamos el apiClient configurado

// --- INTERFAZ ACTUALIZADA ---
// Añadimos los nuevos campos que vendrán desde la API
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
    inputs: string;
    tools_and_techniques: string;
    outputs: string;
}
// ----------------------------

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [processes, setProcesses] = useState<IProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchProcesses = async () => {
            try {
                // Usamos apiClient que ya gestiona el token y su refresco
                const response = await apiClient.get('/pmbok-processes/', {
                    signal: controller.signal
                });
                setProcesses(response.data);
            } catch (err: any) {
                if (err.name === 'CanceledError') {
                    console.log('Request canceled:', err.message);
                } else {
                    console.error("Error fetching processes:", err);
                    setError("Tu sesión puede haber expirado o hay un problema de red. Por favor, intenta iniciar sesión de nuevo.");
                    // El interceptor en apiClient ya debería redirigir si el token falla,
                    // pero podemos forzarlo como respaldo.
                    navigate('/login');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchProcesses();

        return () => {
            controller.abort();
        };
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-100 text-gray-700">Cargando procesos...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen bg-gray-100 text-red-600 font-semibold">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-md sticky top-0 z-10">
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
                        <h1 className="text-3xl font-bold text-gray-800">Guía PMBOK 6ª Edición - 49 Procesos</h1>
                        <p className="text-gray-600 mt-2">Una visión adaptada a un entorno de trabajo ágil.</p>
                    </header>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                        {processes.map((process) => (
                            <div key={process.id} className="bg-white rounded-lg shadow-lg flex flex-col transform hover:-translate-y-1 transition-transform duration-300">
                                <div 
                                    className={`p-4 rounded-t-lg ${process.state ? `${process.state.tailwind_bg_color} ${process.state.tailwind_text_color}` : 'bg-gray-500 text-white'}`}
                                >
                                    <h2 className="font-bold text-lg">{process.process_number}. {process.name}</h2>
                                </div>
                                
                                {/* --- SECCIÓN DE DETALLES AÑADIDA --- */}
                                <div className="p-6 flex-grow space-y-4">
                                    {/* Entradas */}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Entradas</h3>
                                        <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                                            {process.inputs.split('\n').map((item, index) => item && <li key={index}>{item}</li>)}
                                        </ul>
                                    </div>
                                    
                                    {/* Herramientas y Técnicas */}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Herramientas y Técnicas</h3>
                                        <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                                            {process.tools_and_techniques.split('\n').map((item, index) => item && <li key={index}>{item}</li>)}
                                        </ul>
                                    </div>

                                    {/* Salidas */}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Salidas</h3>
                                        <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                                            {process.outputs.split('\n').map((item, index) => item && <li key={index}>{item}</li>)}
                                        </ul>
                                    </div>
                                </div>
                                {/* ------------------------------------ */}
                                
                                <div className="bg-gray-50 border-t border-gray-200 p-4 rounded-b-lg mt-auto">
                                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Estado: <span className="font-semibold">{process.state ? process.state.name : 'No definido'}</span>
                                    </p>
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