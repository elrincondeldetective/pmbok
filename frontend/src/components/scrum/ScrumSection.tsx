// frontend/src/components/scrum/ScrumSection.tsx
import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../../api/apiClient';
import type { IScrumProcess } from '../../types/process';
import SectionHeader from '../common/SectionHeader';
import ScrumGrid from './ScrumGrid';
import ScrumFilterLegend from './ScrumFilterLegend';

const ScrumSection: React.FC = () => {
    const [scrumProcesses, setScrumProcesses] = useState<IScrumProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // --- AÑADIDO: Estado para ambos filtros ---
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
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

    // --- AÑADIDO: Handlers para ambos filtros ---
    const handleStatusFilterClick = (statusName: string) => {
        setSelectedStatus(prev => (prev === statusName ? null : statusName));
    };
    
    const handlePhaseFilterClick = (phaseName: string) => {
        setSelectedPhase(prev => (prev === phaseName ? null : phaseName));
    };

    const clearFilters = () => {
        setSelectedStatus(null);
        setSelectedPhase(null);
    };

    // --- MODIFICADO: Lógica de filtrado para incluir el estatus ---
    const filteredScrumProcesses = useMemo(() => {
        return scrumProcesses.filter(process => {
            const statusMatch = selectedStatus ? process.status?.name === selectedStatus : true;
            const phaseMatch = selectedPhase ? process.phase?.name === selectedPhase : true;
            return statusMatch && phaseMatch;
        });
    }, [scrumProcesses, selectedStatus, selectedPhase]);

    return (
        <section className="mb-16">
            <SectionHeader
                title="Guía Scrum: Una visión adaptada a un entorno de trabajo ágil"
                subtitle="Filtrado por Fases de Trabajo y Grupos de Procesos"
            />
            {loading && <p className="text-center text-gray-700">Cargando procesos de Scrum...</p>}
            {error && <p className="text-center text-red-600 font-semibold">{error}</p>}
            
            {!loading && !error && (
                <>
                    <ScrumFilterLegend
                        selectedStatus={selectedStatus}
                        selectedPhase={selectedPhase}
                        onStatusFilterClick={handleStatusFilterClick}
                        onPhaseFilterClick={handlePhaseFilterClick}
                        onClearFilters={clearFilters}
                    />
                    <ScrumGrid processes={filteredScrumProcesses} />
                </>
            )}
        </section>
    );
};

export default ScrumSection;
