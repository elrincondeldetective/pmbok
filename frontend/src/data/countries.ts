// frontend/src/data/countries.ts
import type { Country } from '../types/process';

// Lista de países con todos los de habla hispana y Estados Unidos.
export const countries: Country[] = [
    { code: 'co', name: 'Colombia' },
    { code: 'ar', name: 'Argentina' },
    { code: 'bo', name: 'Bolivia' },
    { code: 'cl', name: 'Chile' },
    { code: 'cr', name: 'Costa Rica' },
    { code: 'cu', name: 'Cuba' },
    { code: 'do', name: 'República Dominicana' },
    { code: 'ec', name: 'Ecuador' },
    { code: 'sv', name: 'El Salvador' },
    { code: 'es', name: 'España' },
    { code: 'us', name: 'United States' },
    { code: 'gt', name: 'Guatemala' },
    { code: 'gq', name: 'Guinea Ecuatorial' },
    { code: 'hn', name: 'Honduras' },
    { code: 'mx', name: 'México' },
    { code: 'ni', name: 'Nicaragua' },
    { code: 'pa', name: 'Panamá' },
    { code: 'py', name: 'Paraguay' },
    { code: 'pe', name: 'Perú' },
    { code: 'pr', name: 'Puerto Rico' },
    { code: 'uy', name: 'Uruguay' },
    { code: 've', name: 'Venezuela' },
].sort((a, b) => a.name.localeCompare(b.name));

// Aseguramos que no haya duplicados y creamos un mapa para búsqueda rápida
export const uniqueCountries = [...new Map(countries.map(item => [item.code, item])).values()];
export const countryMap = new Map(uniqueCountries.map(country => [country.code, country.name]));