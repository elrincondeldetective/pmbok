// frontend/src/components/scrum/ScrumSection.tsx
import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../../api/apiClient';
import type { IScrumProcess } from '../../types/process';
import SectionHeader from '../common/SectionHeader';
import ScrumGrid from './ScrumGrid';
import ScrumFilterLegend from './ScrumFilterLegend'; // 1. Importar el nuevo componente

const ScrumSection: React.FC = () => {
    const [scrumProcesses, setScrumProcesses] = useState<IScrumProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // 2. Añadir estado para manejar el filtro de fase
    const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchScrumProcesses = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.get<IScrumProcess[]>('/scrum-processes/', {
                    signal: controller.signal
                });
                setScrumProcesses(response.data);
            } catch (err: any) {
                if (err.name !== 'CanceledError') {
                    console.error("Error fetching Scrum processes:", err);
                    setError("No se pudieron cargar los procesos de Scrum.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchScrumProcesses();

        return () => {
            controller.abort();
        };
    }, []);

    // 3. Funciones para manejar los clics en los filtros
    const handlePhaseFilterClick = (phaseName: string) => {
        setSelectedPhase(prev => (prev === phaseName ? null : phaseName));
    };

    const clearFilters = () => {
        setSelectedPhase(null);
    };

    // 4. Lógica de filtrado que se recalcula solo cuando cambian las dependencias
    const filteredScrumProcesses = useMemo(() => {
        if (!selectedPhase) {
            return scrumProcesses;
        }
        return scrumProcesses.filter(process => process.phase?.name === selectedPhase);
    }, [scrumProcesses, selectedPhase]);

    return (
        <section className="mb-16">
            {/* 5. Renderizar la leyenda y filtros arriba del título */}
            {!loading && !error && (
                <ScrumFilterLegend
                    selectedPhase={selectedPhase}
                    onPhaseFilterClick={handlePhaseFilterClick}
                    onClearFilters={clearFilters}
                />
            )}
            <SectionHeader
                title="Guía Scrum Una visión adaptada a un entorno de trabajo ágil."
            />
            {loading && <p className="text-center text-gray-700">Cargando procesos de Scrum...</p>}
            {error && <p className="text-center text-red-600 font-semibold">{error}</p>}
            {/* 6. Pasar los procesos ya filtrados a la cuadrícula */}
            {!loading && !error && <ScrumGrid processes={filteredScrumProcesses} />}
        </section>
    );
};

export default ScrumSection;

