// frontend/src/components/RegisterPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient'; // 👈 CAMBIO 1: Importamos apiClient en lugar de axios
import { AxiosError } from 'axios'; // Importamos AxiosError para un tipado más seguro

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
            // 👇 CAMBIO 2: Usamos apiClient y quitamos la URL base.
            await apiClient.post('/register/', {
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                password: formData.password,
                password2: formData.password2,
            });
            // Si el registro es exitoso, redirigimos al login
            navigate('/login');

        } catch (err) {
            const error = err as AxiosError<{[key: string]: string[]}>; // Tipado para el error de la API
            if (error.response && error.response.data) {
                // Muestra el primer error que envíe la API de forma más segura
                const apiErrors = error.response.data;
                const firstErrorKey = Object.keys(apiErrors)[0];
                if (firstErrorKey && apiErrors[firstErrorKey].length > 0) {
                    setError(apiErrors[firstErrorKey][0]);
                } else {
                    setError('Ocurrió un error durante el registro.');
                }
            } else {
                 setError('Ocurrió un error de red o del servidor.');
            }
            console.error(err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white rounded-lg shadow-lg flex flex-col w-full max-w-md">
                <div className="bg-gray-800 text-white p-6 rounded-t-lg">
                    <h2 className="font-bold text-2xl text-center">Crear Cuenta</h2>
                    <p className="text-center text-gray-300 text-sm mt-1">Únete a la plataforma de gestión de proyectos.</p>
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

export default RegisterPage;
