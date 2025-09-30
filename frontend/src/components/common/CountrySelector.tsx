// frontend/src/components/common/CountrySelector.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import type { Country } from '../../types/process';

// ===== INICIO: LISTA DE PAÍSES =====
// Lista de países actualizada con todos los de habla hispana y Estados Unidos.
const countries: Country[] = [
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
// Se re-inserta Colombia al principio para que sea el default
countries.unshift({ code: 'co', name: 'Colombia' });
const uniqueCountries = [...new Map(countries.map(item => [item.code, item])).values()];
// ===== FIN: LISTA DE PAÍSES =====

interface CountrySelectorProps {
  /** Código (lowercase) del país seleccionado, o null si no hay */
  value: string | null;
  /** Notifica el país elegido (o null para limpiar) */
  onChange: (country: Country | null) => void;
  /** Permite limpiar a “Sin país” (por defecto true) */
  allowClear?: boolean;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ value, onChange, allowClear = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(
    value ? uniqueCountries.find(c => c.code === value) ?? null : null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sincroniza cuando cambia el valor desde el padre
  useEffect(() => {
    setSelectedCountry(value ? uniqueCountries.find(c => c.code === value) ?? null : null);
  }, [value]);

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCountry = (country: Country | null) => {
    setSelectedCountry(country);
    setIsOpen(false);
    onChange(country);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="flex items-center justify-center w-full rounded-full bg-white/25 text-white/95 text-xs font-bold px-3 py-1 shadow-sm hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors duration-200"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          {selectedCountry ? (
            <>
              <img
                src={`https://flagcdn.com/w20/${selectedCountry.code}.png`}
                width="20"
                alt={`Bandera de ${selectedCountry.name}`}
                className="mr-2"
              />
              {selectedCountry.name}
            </>
          ) : (
            <>Sin país</>
          )}
          <FaChevronDown
            className={`w-3 h-3 ml-2 -mr-1 text-white/80 transform transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div
          className="origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 animate-fade-in-down"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Scroll interno para lista larga */}
          <div className="py-1 max-h-60 overflow-y-auto" role="none">
            {allowClear && (
              <a
                href="#"
                className="text-gray-700 flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectCountry(null);
                }}
              >
                Sin país
              </a>
            )}
            {uniqueCountries.map((country) => (
              <a
                href="#"
                key={country.code}
                className="text-gray-700 flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectCountry(country);
                }}
              >
                <img
                  src={`https://flagcdn.com/w20/${country.code}.png`}
                  width="20"
                  alt={`Bandera de ${country.name}`}
                  className="mr-3"
                />
                {country.name}
              </a>
            ))}
          </div>
        </div>
      )}
      {/* Estilos para la animación del desplegable */}
      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.15s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default CountrySelector;
