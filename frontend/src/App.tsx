// frontend/src/App.tsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import "./App.css";

import ProtectedRoute from '@/components/ProtectedRoute';
import Dashboard from '@/components/Dashboard';
import LoginPage from '@/components/LoginPage';
import RegisterPage from '@/components/RegisterPage';
import UnifiedProcessModal from '@/components/modal/UnifiedProcessModal';
import { ProcessProvider } from '@/context/ProcessContext';
import { AuthProvider } from '@/context/AuthContext';
import TwoFAModal from '@/components/modal/TwoFAModal';
// ===== FIN: NUEVOS IMPORTS =====

function App() {
    const location = useLocation();
    const background = location.state && location.state.background;

    return (
        // ===== INICIO: ENVOLVER CON AUTHPROVIDER =====
        <AuthProvider>
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
                        <Route path="/process/:processId" element={<UnifiedProcessModal />} />
                        <Route path="/scrum-process/:processId" element={<UnifiedProcessModal />} />
                    </Routes>
                )}
                {/* Renderizar el modal de 2FA globalmente */}
                <TwoFAModal /> 
            </ProcessProvider>
        </AuthProvider>
        // ===== FIN: ENVOLVER CON AUTHPROVIDER =====
    );
}

export default App;

