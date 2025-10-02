#!/bin/bash

# --- Script para implementar el modal de detalles del proceso (Corregido) ---

echo "Iniciando la implementación del modal de procesos con correcciones de diseño..."

# 1. Crear directorios necesarios si no existen
echo "Asegurando que la estructura de directorios exista..."
mkdir -p frontend/src/components/dashboard

# 2. Crear el nuevo componente ProcessModal.tsx (CORREGIDO)
#    - Se cambió el fondo oscuro 'bg-black bg-opacity-50' por un fondo más sutil
#      y moderno 'bg-gray-900/20' que solo atenúa el fondo sin oscurecerlo por completo.
echo "Creando el archivo: frontend/src/components/ProcessModal.tsx"
cat <<'EOF' > frontend/src/components/ProcessModal.tsx
// frontend/src/components/ProcessModal.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import type { IProcess } from '../types/process';

const ProcessModal: React.FC = () => {
    const { processId } = useParams<{ processId: string }>();
    const navigate = useNavigate();
    const [process, setProcess] = useState<IProcess | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!processId) return;

        const controller = new AbortController();
        const fetchProcess = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get<IProcess>(`/pmbok-processes/${processId}/`, {
                    signal: controller.signal
                });
                setProcess(response.data);
            } catch (err: any) {
                if (err.name !== 'CanceledError') {
                    console.error("Failed to fetch process details:", err);
                    setError('No se pudo cargar el detalle del proceso. Inténtalo de nuevo.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProcess();
        return () => controller.abort();
    }, [processId]);

    const handleClose = () => {
        navigate(-1); // Vuelve a la ubicación anterior (el dashboard)
    };

    // Función para renderizar las listas de Entradas, Herramientas y Salidas
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
            // ----- CORRECCIÓN 1: Fondo del modal -----
            // Se cambió 'bg-black bg-opacity-50' por 'bg-gray-900/20' para un efecto más suave y translúcido.
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 flex justify-center items-center p-4 animate-fade-in"
            onClick={handleClose} // Cierra el modal al hacer clic en el fondo
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-transform duration-300 scale-95 animate-scale-in"
                onClick={(e) => e.stopPropagation()} // Evita que el modal se cierre al hacer clic dentro de él
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
                        <div className={`p-6 rounded-t-xl flex justify-between items-center ${process.status?.tailwind_bg_color || 'bg-gray-700'} ${process.status?.tailwind_text_color || 'text-white'}`}>
                            <div>
                                <h2 className="text-2xl font-bold">{process.process_number}. {process.name}</h2>
                                {process.stage && <p className={`text-sm opacity-90 mt-1`}>{process.stage.name}</p>}
                            </div>
                            <button onClick={handleClose} className="text-2xl font-bold hover:opacity-75 transition-opacity" aria-label="Cerrar modal">
                                &times;
                            </button>
                        </div>
                        
                        {/* Cuerpo del Modal con scroll */}
                        <div className="p-8 overflow-y-auto space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Resumen del Proceso (PMBOK® 6)</h3>
                                <p className="text-gray-600 bg-blue-50 p-4 rounded-md border-l-4 border-blue-400">
                                    Este proceso documenta formalmente el proyecto, vinculando el trabajo a los objetivos estratégicos de la organización. El <strong>{process.outputs.split('\n')[0].toLowerCase()}</strong> resultante otorga al director del proyecto la autoridad para aplicar los recursos de la organización a las actividades del proyecto.
                                </p>
                            </div>

                            {renderList('Entradas', process.inputs)}
                            {renderList('Herramientas y Técnicas', process.tools_and_techniques)}
                            {renderList('Salidas', process.outputs)}
                        </div>

                        {/* Pie de página del Modal */}
                        <div className="p-4 bg-gray-100 rounded-b-xl border-t text-right">
                            <button onClick={handleClose} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-md hover:bg-gray-700 transition duration-300">
                                Cerrar
                            </button>
                        </div>
                    </>
                )}
            </div>
            {/* Estilos para animaciones simples de entrada */}
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

export default ProcessModal;
EOF

# 3. Modificar el archivo App.tsx para gestionar las rutas del modal
echo "Modificando el archivo: frontend/src/App.tsx"
cat <<'EOF' > frontend/src/App.tsx
// frontend/src/App.tsx
// 1. IMPORTAMOS useLocation
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import "./App.css";

// Importamos los componentes desde sus archivos
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
// 2. IMPORTAMOS el nuevo componente de Modal
import ProcessModal from './components/ProcessModal';


function App() {
  // 3. Obtenemos la ubicación y revisamos si hay un estado de "background"
  const location = useLocation();
  const background = location.state && location.state.background;

  return (
    <>
      {/* 4. Renderizamos las rutas principales. La prop `location` es clave. */}
      {/* Muestra las rutas de la página que está *detrás* del modal. */}
      <Routes location={background || location}>
        <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* 5. Renderizamos la ruta del modal de forma condicional. */}
      {/* Esto mostrará el modal encima de la página de fondo. */}
      {background && (
        <Routes>
          <Route path="/process/:processId" element={<ProcessModal />} />
        </Routes>
      )}
    </>
  );
}

export default App;
EOF

# 4. Modificar el archivo ProcessCard.tsx (CORREGIDO)
#    - Se restauró el padding a 'p-6' y el espaciado a 'space-y-4'.
#    - Se ajustaron los márgenes y espaciados internos para que coincidan con el diseño original.
echo "Modificando el archivo: frontend/src/components/dashboard/ProcessCard.tsx"
cat <<'EOF' > frontend/src/components/dashboard/ProcessCard.tsx
// frontend/src/components/dashboard/ProcessCard.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { IProcess } from '../../types/process';

interface ProcessCardProps {
    process: IProcess;
}

const ProcessCard: React.FC<ProcessCardProps> = ({ process }) => {
    const location = useLocation();

    return (
        <Link 
            to={`/process/${process.id}`} 
            state={{ background: location }}
            className="block"
        >
            <div className="bg-white rounded-lg shadow-lg flex flex-col h-full transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
                <div
                    className={`p-4 rounded-t-lg ${process.status ? `${process.status.tailwind_bg_color} ${process.status.tailwind_text_color}` : 'bg-gray-500 text-white'}`}
                >
                    <h2 className="font-bold text-lg leading-tight">{process.process_number}. {process.name}</h2>
                </div>

                {/* ----- CORRECCIÓN 2: Espaciado de las tarjetas ----- */}
                {/* Se cambió 'p-4' por 'p-6' y 'space-y-3' por 'space-y-4' para más aire. */}
                <div className="p-6 flex-grow flex flex-col space-y-4">
                    {process.inputs && <div>
                        {/* Se aumentó el margen inferior de mb-1 a mb-2 */}
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Entradas</h3>
                        {/* Se aumentó el espaciado entre items de space-y-1 a space-y-2 */}
                        <ul className="list-disc list-inside text-sm space-y-2 text-gray-700">
                            {process.inputs.split('\n').map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
                        </ul>
                    </div>}

                    {process.tools_and_techniques && <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Herramientas y Técnicas</h3>
                        <ul className="list-disc list-inside text-sm space-y-2 text-gray-700">
                            {process.tools_and_techniques.split('\n').map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
                        </ul>
                    </div>}

                    {process.outputs && <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Salidas</h3>
                        <ul className="list-disc list-inside text-sm space-y-2 text-gray-700">
                            {process.outputs.split('\n').map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
                        </ul>
                    </div>}
                </div>

                {/* Se restauró el padding de p-3 a p-4 para consistencia */}
                <div className={`border-t p-4 rounded-b-lg mt-auto text-center ${process.stage ? `${process.stage.tailwind_bg_color} ${process.stage.tailwind_text_color}` : 'bg-gray-200 text-gray-700'}`}>
                    <p className="text-xs font-bold uppercase tracking-wider">
                        {process.stage ? process.stage.name : 'Etapa no definida'}
                    </p>
                </div>
            </div>
        </Link>
    );
};

export default ProcessCard;
EOF

echo ""
echo "¡Hecho! El script 'implement_modal_corregido.sh' ha sido creado."
echo "Para usarlo, primero dale permisos de ejecución con el comando:"
echo "chmod +x implement_modal_corregido.sh"
echo ""
echo "Luego, ejecútalo desde la raíz de tu proyecto con:"
echo "./implement_modal_corregido.sh"
