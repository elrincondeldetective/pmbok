// frontend/src/api/apiClient.ts
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Necesitarás instalar esta librería

// Creamos una instancia de Axios con configuración base
const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000/api', // URL base de tu API
});

// ⭐ Interceptor de Petición (Request)
// Se ejecuta ANTES de que cada petición sea enviada.
apiClient.interceptors.request.use(
    async (config) => {
        let accessToken = localStorage.getItem('access_token');

        // Si no hay token, no hacemos nada
        if (!accessToken) {
            return config;
        }

        // Decodificamos el token para verificar su fecha de expiración
        const user = jwtDecode(accessToken);
        const isExpired = user.exp && Date.now() >= user.exp * 1000;

        // Si el token ha expirado, intentamos refrescarlo ANTES de enviar la petición original
        if (isExpired) {
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
                    refresh: refreshToken,
                });
                
                accessToken = response.data.access;
                localStorage.setItem('access_token', accessToken);
                
            } catch (error) {
                // Si el refresh token también falla, limpiamos todo y forzamos el logout.
                console.error("Refresh token failed, logging out.", error);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login'; // Redirigimos al login
                return Promise.reject(error);
            }
        }
        
        // Adjuntamos el token (nuevo o el original) a la cabecera de la petición
        config.headers.Authorization = `Bearer ${accessToken}`;
        return config;
    },
    (error) => {
        // Manejo de errores en la configuración de la petición
        return Promise.reject(error);
    }
);

export default apiClient;