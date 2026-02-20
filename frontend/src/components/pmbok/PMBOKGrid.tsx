import React from 'react';
import Card from '../common/Card.tsx'; 
import type { IPMBOKProcess } from '../../types/process';

interface PMBOKGridProps {
  processes: IPMBOKProcess[];
}

const PMBOKGrid: React.FC<PMBOKGridProps> = ({ processes }) => {
  if (processes.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">No se encontraron procesos que coincidan con los filtros seleccionados.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
      {processes.map((process) => (
         <Card key={process.id} process={process} />
      ))}
    </div>
  );
};

export default PMBOKGrid;