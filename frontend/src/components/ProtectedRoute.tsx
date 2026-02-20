// frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

// Este componente envuelve las rutas que requieren autenticación
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  // Verificamos si existe un token de acceso en el localStorage
  const token = localStorage.getItem('access_token');

  if (!token) {
    // Si no hay token, redirigimos al usuario a la página de login
    return <Navigate to="/login" />;
  }

  // Si hay un token, renderizamos el componente hijo (la página protegida)
  return children;
};

export default ProtectedRoute;
