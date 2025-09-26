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
