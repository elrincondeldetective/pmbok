// frontend/src/components/scrum/ScrumSection.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient.ts'; // Ruta corregida
import type { IScrumProcess } from '../../types/process';
import SectionHeader from '../common/SectionHeader.tsx'; // Ruta corregida
import ScrumGrid from './ScrumGrid.tsx'; // Ruta corregida

const ScrumSection: React.FC = () => {
    const [scrumProcesses, setScrumProcesses] = useState<IScrumProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchScrumProcesses = async () => {
            try {
                const response = await apiClient.get('/scrum-processes/', {
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

    return (
        <section className="mb-16">
            <SectionHeader 
                title="Guía Scrum"
                subtitle="Una visión adaptada a un entorno de trabajo ágil."
            />
            {loading && <p className="text-center text-gray-700">Cargando procesos de Scrum...</p>}
            {error && <p className="text-center text-red-600 font-semibold">{error}</p>}
            {!loading && !error && <ScrumGrid processes={scrumProcesses} />}
        </section>
    );
};

export default ScrumSection;

