// frontend/src/components/ScrumProcessModal.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// RUTA CORREGIDA: ../../api/apiClient -> ../api/apiClient
import apiClient from '../api/apiClient';
import type { IScrumProcess } from '../../types/process';

const ScrumProcessModal: React.FC = () => {
    const { processId } = useParams<{ processId: string }>();
    const navigate = useNavigate();
    const [process, setProcess] = useState<IScrumProcess | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!processId) return;

        const controller = new AbortController();
        const fetchProcess = async () => {
            setLoading(true);
            try {
                // Hacemos la petición al endpoint de scrum-processes
                const response = await apiClient.get<IScrumProcess>(`/scrum-processes/${processId}/`, {
                    signal: controller.signal
                });
                setProcess(response.data);
            } catch (err: any) {
                if (err.name !== 'CanceledError') {
                    console.error("Failed to fetch scrum process details:", err);
                    setError('No se pudo cargar el detalle del proceso de Scrum. Inténtalo de nuevo.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProcess();
        return () => controller.abort();
    }, [processId]);

    const handleClose = () => {
        navigate(-1);
    };

    const renderList = (title: string, items: string | undefined) => {
        if (!items) return null;
        return (
            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600 bg-gray-50 p-4 rounded-md border border-gray-200">
                    {items.split('\n').map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
                </ul>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 flex justify-center items-center p-4 animate-fade-in"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-transform duration-300 scale-95 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {loading && (
                    <div className="flex items-center justify-center h-48">
                        <p className="text-gray-600">Cargando detalles del proceso...</p>
                    </div>
                )}
                {error && (
                    <div className="flex flex-col items-center justify-center h-48 p-8">
                        <p className="text-red-600 font-semibold">{error}</p>
                        <button onClick={handleClose} className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md">Cerrar</button>
                    </div>
                )}

                {process && (
                    <>
                        {/* Cabecera del Modal */}
                        <div className={`p-6 rounded-t-xl ${process.status?.tailwind_bg_color || 'bg-gray-700'} ${process.status?.tailwind_text_color || 'text-white'}`}>
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-grow">
                                    <h2 className="text-2xl font-bold">{process.process_number}. {process.name}</h2>
                                    {process.phase && <p className={`text-sm opacity-90 mt-1`}>{process.phase.name}</p>}
                                </div>
                                <button onClick={handleClose} className="text-2xl font-bold hover:opacity-75 transition-opacity" aria-label="Cerrar modal">
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* Cuerpo del Modal */}
                        <div className="p-8 overflow-y-auto space-y-6">
                            {renderList('Entradas', process.inputs)}
                            {renderList('Herramientas y Técnicas', process.tools_and_techniques)}
                            {renderList('Salidas', process.outputs)}
                        </div>

                        {/* Pie del Modal */}
                        <div className="p-4 bg-gray-100 rounded-b-xl border-t text-right">
                            <button onClick={handleClose} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-md hover:bg-gray-700 transition duration-300">
                                Cerrar
                            </button>
                        </div>
                    </>
                )}
            </div>
             {/* Estilos para animaciones */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ScrumProcessModal;
