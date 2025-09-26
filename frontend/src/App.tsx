// frontend/src/App.tsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import "./App.css";

import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProcessModal from './components/ProcessModal';
import { ProcessProvider } from './context/ProcessContext'; // 👈 AÑADIDO

function App() {
    const location = useLocation();
    const background = location.state && location.state.background;

    return (
        // 👇 AÑADIDO: Envolvemos todo en el Provider
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
                    <Route path="/process/:processId" element={<ProcessModal />} />
                </Routes>
            )}
        </ProcessProvider>
    );
}

export default App;