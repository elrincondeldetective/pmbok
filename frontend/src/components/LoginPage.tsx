// frontend/src/components/LoginPage.tsx

// Importamos React para poder usar JSX
import React from 'react';

// Creamos el componente funcional LoginPage
const LoginPage: React.FC = () => {
  return (
    // Contenedor principal que centra el formulario en la pantalla
    <div className="flex items-center justify-center min-h-screen bg-gray-100">

      {/* Tarjeta de Login */}
      <div className="bg-white rounded-lg shadow-lg flex flex-col w-full max-w-md">

        {/* Encabezado de la Tarjeta */}
        <div className="bg-gray-800 text-white p-6 rounded-t-lg">
          <h2 className="font-bold text-2xl text-center">Iniciar Sesión</h2>
          <p className="text-center text-gray-300 text-sm mt-1">Accede a tu panel de gestión de proyectos.</p>
        </div>

        {/* Cuerpo de la Tarjeta con el Formulario */}
        <div className="p-8">
          <form action="#" method="POST" className="space-y-6">
            
            {/* Campo de Correo Electrónico */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <div className="mt-1">
                <input id="email" name="email" type="email" autoComplete="email" required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm" />
              </div>
            </div>

            {/* Campo de Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1">
                <input id="password" name="password" type="password" autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm" />
              </div>
            </div>

            {/* Recordarme y Olvidé mi contraseña */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox"
                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Recordarme
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            {/* Botón de Ingresar */}
            <div>
              <button type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700">
                Ingresar
              </button>
            </div>
          </form>

          {/* Divisor */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  O
                </span>
              </div>
            </div>
          </div>

          {/* Enlace para Registrarse */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Regístrate aquí
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

// Exportamos el componente para poder usarlo en otros archivos
export default LoginPage;