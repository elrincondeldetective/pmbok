// frontend/src/components/scrum/ScrumGrid.tsx
import React from 'react';
import Card from '../common/Card.tsx'; // Ruta corregida
import type { IScrumProcess } from '../../types/process.ts';

interface ScrumGridProps {
  processes: IScrumProcess[];
}

const ScrumGrid: React.FC<ScrumGridProps> = ({ processes }) => {
  if (processes.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">No se encontraron procesos de Scrum.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
      {processes.map((process) => (
        <Card key={process.id} process={process} framework="scrum" />
      ))}
    </div>
  );
};

export default ScrumGrid;

