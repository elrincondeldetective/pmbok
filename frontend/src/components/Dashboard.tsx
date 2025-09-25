// frontend/src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient.ts'; // Usamos el apiClient configurado

// --- INTERFACES ---
interface IProcessStatus {
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}

interface IProcessStage {
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}

interface IProcess {
    id: number;
    process_number: number;
    name: string;
    status: IProcessStatus | null;
    stage: IProcessStage | null;
    inputs: string;
    tools_and_techniques: string;
    outputs: string;
}
// ------------------

// --- DATOS PARA LA LEYENDA ---
const statusLegendData = [
    { name: 'Base Estratégica', color: 'bg-indigo-800', description: 'Procesos que establecen la visión y el marco inicial del proyecto.' },
    { name: 'Ritmo de Sprint (2 Semanas)', color: 'bg-blue-700', description: 'Procesos integrados en las ceremonias de Scrum cada dos semanas.' },
    { name: 'Ritmo Diario', color: 'bg-green-600', description: 'Procesos que se viven en la colaboración y coordinación diaria.' },
    { name: 'Burocracia Innecesaria', color: 'bg-amber-500', description: 'Procesos formales reemplazados por prácticas ágiles para ganar velocidad.' },
    { name: 'Inaplicable', color: 'bg-gray-400', description: 'Procesos no aplicables a este modelo de proyecto ágil.' },
];

const stageLegendData = [
    { name: 'Integración', color: 'bg-gray-200' },
    { name: 'Interesados', color: 'bg-purple-100' },
    { name: 'Alcance', color: 'bg-blue-100' },
    { name: 'Cronograma', color: 'bg-cyan-100' },
    { name: 'Costos', color: 'bg-green-100' },
    { name: 'Calidad', color: 'bg-red-100' },
    { name: 'Recursos', color: 'bg-lime-100' },
    { name: 'Comunicaciones', color: 'bg-rose-100' },
    { name: 'Riesgos', color: 'bg-amber-100' },
    { name: 'Adquisiciones', color: 'bg-orange-100' },
];
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
                    
                    {/* --- SECCIÓN DE LEYENDA --- */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-12">
                        <h3 className="font-bold text-lg mb-4 text-gray-700">Leyenda de Colores</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {/* Leyenda de Estatus */}
                            <div>
                                <h4 className="font-semibold text-gray-600 mb-3">Estatus de Aplicabilidad (Cabecera)</h4>
                                <div className="space-y-2">
                                    {statusLegendData.map(item => (
                                        <div key={item.name} className="flex items-center">
                                            <span className={`w-5 h-5 rounded-full mr-3 ${item.color}`}></span>
                                            <span className="text-sm"><strong>{item.name}:</strong> {item.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Leyenda de Etapas */}
                            <div>
                                <h4 className="font-semibold text-gray-600 mb-3">Área de Conocimiento (Pie de Página)</h4>
                                <div className="flex flex-wrap gap-2">
                                     {stageLegendData.map(item => (
                                        <div key={item.name} className={`flex items-center px-2 py-1 rounded-full text-xs ${item.color}`}>
                                           {item.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* ---------------------------------- */}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                        {processes.map((process) => (
                            <div key={process.id} className="bg-white rounded-lg shadow-lg flex flex-col transform hover:-translate-y-1 transition-transform duration-300">
                                {/* El color del header viene del 'status' */}
                                <div 
                                    className={`p-4 rounded-t-lg ${process.status ? `${process.status.tailwind_bg_color} ${process.status.tailwind_text_color}` : 'bg-gray-500 text-white'}`}
                                >
                                    <h2 className="font-bold text-lg">{process.process_number}. {process.name}</h2>
                                </div>
                                
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
                                
                                {/* El footer ahora muestra la 'stage' y usa sus colores */}
                                <div className={`border-t p-4 rounded-b-lg mt-auto text-center ${process.stage ? `${process.stage.tailwind_bg_color} ${process.stage.tailwind_text_color}` : 'bg-gray-200 text-gray-700'}`}>
                                    <p className="text-xs font-bold uppercase tracking-wider">
                                        {process.stage ? process.stage.name : 'Etapa no definida'}
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

