// frontend/src/App.tsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import "./App.css";

import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
// CAMBIO 1: Importar el nuevo modal unificado
import UnifiedProcessModal from './components/UnifiedProcessModal'; 
import { ProcessProvider } from './context/ProcessContext';

function App() {
    const location = useLocation();
    const background = location.state && location.state.background;

    return (
        <ProcessProvider>
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

            {background && (
                <Routes>
                    {/* CAMBIO 2: Ambas rutas ahora apuntan al mismo componente modal */}
                    <Route path="/process/:processId" element={<UnifiedProcessModal />} />
                    <Route path="/scrum-process/:processId" element={<UnifiedProcessModal />} />
                </Routes>
            )}
        </ProcessProvider>
    );
}

export default App;