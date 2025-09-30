// frontend/src/components/common/GlobalCountrySelector.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import type { Country } from '../../types/process';

// Lista de países
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
countries.unshift({ code: 'co', name: 'Colombia' });
const uniqueCountries = [...new Map(countries.map(item => [item.code, item])).values()];

interface GlobalCountrySelectorProps {
  value: string | null;
  onChange: (country: Country | null) => void;
  allowClear?: boolean;
}

const GlobalCountrySelector: React.FC<GlobalCountrySelectorProps> = ({ value, onChange, allowClear = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(
    value ? uniqueCountries.find(c => c.code === value) ?? null : null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedCountry(value ? uniqueCountries.find(c => c.code === value) ?? null : null);
  }, [value]);

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

  const buttonClasses = "inline-flex items-center justify-center rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-colors duration-200";
  const chevronClasses = "w-3 h-3 ml-2 text-gray-500";

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className={buttonClasses}
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
              <span>{selectedCountry.name}</span>
            </>
          ) : (
            <span>Sin país</span>
          )}
          <FaChevronDown
            className={`${chevronClasses} transform transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div
          className="origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-30 animate-fade-in-down"
          role="menu"
          aria-orientation="vertical"
        >
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

export default GlobalCountrySelector;
