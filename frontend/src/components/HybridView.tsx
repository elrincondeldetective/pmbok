// frontend/src/components/HybridView.tsx
import React from 'react';
import PMBOKSection from './pmbok/PMBOKSection.tsx'; // Ruta corregida
import ScrumSection from './scrum/ScrumSection.tsx'; // Ruta corregida

const HybridView: React.FC = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
      {/* Primero mostramos la sección de Scrum */}
      <ScrumSection />
      
      {/* Separador visual */}
      <hr className="border-t-2 border-gray-300 border-dashed" />

      {/* Luego, la sección de PMBOK con su Kanban y filtros */}
      <PMBOKSection />
    </div>
  );
};

export default HybridView;

