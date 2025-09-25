// frontend/src/App.tsx
import React, { useState } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./App.css"

// --- Componente de Ruta Protegida ---
// Envuelve las rutas que requieren que el usuario esté autenticado.
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

// --- Componente Dashboard ---
// Esta es la página principal que se muestra después de iniciar sesión.
const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-md">
                <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Panel de Proyectos</h1>
                    <button 
                        onClick={handleLogout}
                        className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition duration-300"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </nav>
            <main>
                {/* Contenido principal de tu aplicación (antes en index.html) */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <header className="mb-8">
                            <h1 className="text-xl font-bold">Guía PMBOK 6 - 49 procesos, entradas, herramientas y salidas</h1>
                        </header>
                        <hr className="border-gray-300" />
                        <main className="my-16 space-y-4">
                            <p><a href="#" className="text-lg text-gray-600 hover:text-blue-600 underline">Ver por grupo de procesos</a></p>
                            <p><a href="#" className="text-lg text-gray-600 hover:text-blue-600 underline">Ver por área de conocimiento</a></p>
                            <p><a href="#" className="text-lg text-gray-600 hover:text-blue-600 underline">Scrum Cards</a></p>
                        </main>
                         {/* El resto del contenido de tu index.html iría aquí */}
                    </div>
                </div>
            </main>
        </div>
    );
};

// --- Componente de Página de Registro ---
const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        password2: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.password2) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        try {
            await axios.post('http://127.0.0.1:8000/api/register/', formData);
            navigate('/login');
        } catch (err: any) {
            if (err.response && err.response.data) {
                const apiErrors = err.response.data;
                const firstErrorKey = Object.keys(apiErrors)[0];
                setError(Array.isArray(apiErrors[firstErrorKey]) ? apiErrors[firstErrorKey][0] : 'Error en el registro.');
            } else {
                 setError('Ocurrió un error durante el registro.');
            }
            console.error(err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white rounded-lg shadow-lg flex flex-col w-full max-w-md">
                <div className="bg-gray-800 text-white p-6 rounded-t-lg">
                    <h2 className="font-bold text-2xl text-center">Crear Cuenta</h2>
                </div>
                <div className="p-8">
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input name="first_name" type="text" placeholder="Nombre" onChange={handleChange} required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm" />
                        <input name="last_name" type="text" placeholder="Apellido" onChange={handleChange} required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm" />
                        <input name="email" type="email" placeholder="Correo Electrónico" onChange={handleChange} required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm" />
                        <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm" />
                        <input name="password2" type="password" placeholder="Confirmar Contraseña" onChange={handleChange} required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm" />
                        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700">
                            Registrarse
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            ¿Ya tienes una cuenta?{' '}
                            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Componente de Página de Login ---
const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/token/', { email, password });
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            navigate('/');
        } catch (err) {
            setError('Error al iniciar sesión. Verifica tu correo y contraseña.');
            console.error(err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white rounded-lg shadow-lg flex flex-col w-full max-w-md">
                <div className="bg-gray-800 text-white p-6 rounded-t-lg">
                    <h2 className="font-bold text-2xl text-center">Iniciar Sesión</h2>
                </div>
                <div className="p-8">
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                            <div className="mt-1">
                                <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
                            <div className="mt-1">
                                <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm" />
                            </div>
                        </div>
                        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700">
                            Ingresar
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            ¿No tienes una cuenta?{' '}
                            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                                Regístrate aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Componente Principal App ---
// Define todas las rutas de la aplicación.
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

