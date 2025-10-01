// frontend/src/components/common/DepartmentSelector.tsx
import React, { useMemo } from 'react';
import type { IDepartment } from '../../types/process';

interface DepartmentOption {
    id: number;
    name: string;
    level: number;
}

interface DepartmentSelectorProps {
    value: number | null;
    onChange: (departmentId: number | null) => void;
    departments: IDepartment[];
    disabled?: boolean;
}

const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({ value, onChange, departments, disabled = false }) => {
    // Transforma la lista plana de departamentos en una lista jerárquica para el dropdown
    const departmentOptions = useMemo(() => {
        const options: DepartmentOption[] = [];
        const buildOptions = (parentId: number | null, level: number) => {
            departments
                .filter(d => d.parent === parentId)
                .forEach(dept => {
                    options.push({ id: dept.id, name: dept.name, level });
                    buildOptions(dept.id, level + 1); // Busca hijos recursivamente
                });
        };
        buildOptions(null, 0); // Comienza con los departamentos de nivel superior
        return options;
    }, [departments]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value ? parseInt(e.target.value, 10) : null;
        onChange(selectedId);
    };

    return (
        <select
            value={value ?? ''}
            onChange={handleChange}
            disabled={disabled}
            className="bg-white/20 text-white text-sm font-semibold rounded-md p-2 border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto"
            onClick={(e) => e.stopPropagation()}
            title={disabled ? "Selecciona una versión de país para asignar un departamento" : "Asignar Departamento"}
        >
            <option value="" className="text-black">Asignar Departamento...</option>
            {departmentOptions.map(option => (
                <option key={option.id} value={option.id} className="text-black">
                    {'\u00A0'.repeat(option.level * 4)}{option.name}
                </option>
            ))}
        </select>
    );
};

export default DepartmentSelector;
