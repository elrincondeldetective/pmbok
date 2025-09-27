// frontend/src/components/pmbok/PMBOKSection.tsx
import React from 'react';
import type { IPMBOKProcess } from '../../types/process.ts';
import PMBOKGrid from './PMBOKGrid.tsx';

// El componente se simplifica para solo renderizar la cuadrícula de tarjetas.
interface PMBOKSectionProps {
    processes: IPMBOKProcess[];
}

const PMBOKSection: React.FC<PMBOKSectionProps> = ({ processes }) => {
    // La responsabilidad de mostrar estados de carga/error ahora está en el Dashboard.
    // Este componente solo se preocupa de renderizar la cuadrícula con los datos que le pasan.
    return (
        <div className="mt-12">
             <PMBOKGrid processes={processes} />
        </div>
    );
};

export default PMBOKSection;

