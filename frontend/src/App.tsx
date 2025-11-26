// /webapps/erd-ecosystem/apps/pmbok/frontend/src/App.tsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import "./App.css";

import ProtectedRoute from '@/components/ProtectedRoute';
import Dashboard from '@/components/Dashboard';
import LoginPage from '@/components/LoginPage';
import RegisterPage from '@/components/RegisterPage';
import UnifiedProcessModal from '@/components/modal/UnifiedProcessModal';
// Importamos el nuevo visualizador
import GitFlowVisualizer from '@/components/dashboard/GitFlowVisualizer';

import { ProcessProvider } from '@/context/ProcessContext';
import { AuthProvider } from '@/context/AuthContext';
import TwoFAModal from '@/components/modal/TwoFAModal';

function App() {
    const location = useLocation();
    const background = location.state && location.state.background;

    return (
        <AuthProvider>
            <ProcessProvider>
                <Routes location={background || location}>
                    {/* Ruta Principal Dashboard */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                    />

                    {/* NUEVA RUTA: Visualizador de Git */}
                    <Route path="/git-history" element={
                        <ProtectedRoute>
                            <GitFlowVisualizer />
                        </ProtectedRoute>
                    } 
                    />

                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    
                    {/* Redirección por defecto */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>

                {/* Rutas Modales (Se renderizan sobre la ruta anterior) */}
                {background && (
                    <Routes>
                        <Route path="/process/:processId" element={<UnifiedProcessModal />} />
                        <Route path="/scrum-process/:processId" element={<UnifiedProcessModal />} />
                    </Routes>
                )}
                
                {/* Renderizar el modal de 2FA globalmente */}
                <TwoFAModal /> 
            </ProcessProvider>
        </AuthProvider>
    );
}

export default App;
