// frontend/src/api/apiClient.ts
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// 1. Lee la variable de entorno de Vite. Si no existe, usa la de localhost.
// Esto permite que la app funcione tanto en Docker (con la variable de entorno) como localmente o en Amplify (sin ella).
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// 2. Crea la instancia de Axios con la URL dinámica.
const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

// Interceptor de Petición (Request)

apiClient.interceptors.request.use(
    async (config) => {
        const accessToken = localStorage.getItem('access_token');

        // Si no hay token de acceso, la petición continúa sin autenticación.
        if (!accessToken) {
            return config;
        }

        // Decodificamos el token para verificar su fecha de expiración
        const user = jwtDecode<{ exp: number }>(accessToken);
        const isExpired = user.exp && Date.now() >= user.exp * 1000;

        // Si el token ha expirado, intentamos refrescarlo
        if (isExpired) {
            const refreshToken = localStorage.getItem('refresh_token');
            
            // Si no hay refresh token, no podemos hacer nada. Forzamos el logout.
            if (!refreshToken) {
                console.error("Access token expired but no refresh token found. Logging out.");
                localStorage.removeItem('access_token');
                window.location.href = '/login';
                return Promise.reject(new Error("No refresh token available"));
            }

            try {
                // 3. Usa una URL dinámica también para el refresh token.
                // Se crea una nueva instancia de axios aquí para evitar un bucle infinito en el interceptor.
                const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
                    refresh: refreshToken,
                });
                
                const newAccessToken = response.data.access;
                localStorage.setItem('access_token', newAccessToken);
                
                // Actualizamos la cabecera de la petición actual con el nuevo token
                if (config.headers) {
                    config.headers.Authorization = `Bearer ${newAccessToken}`;
                }
                
            } catch (error) {
                // Si el refresh token también falla, limpiamos todo y forzamos el logout.
                console.error("Refresh token failed, logging out.", error);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login'; // Redirigimos al login
                return Promise.reject(error);
            }
        } else {
            // Si el token de acceso no ha expirado, lo usamos
            if (config.headers) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
        }
        
        return config;
    },
    (error) => {
        // Manejo de errores en la configuración de la petición
        return Promise.reject(error);
    }
);

export default apiClient;
