// frontend/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import "./App.css";

// Importamos los componentes desde sus archivos
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

function App() {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;