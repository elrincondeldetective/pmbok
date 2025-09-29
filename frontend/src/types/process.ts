// frontend/src/types/process.ts

export type KanbanStatus = 'unassigned' | 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

// --- CAMBIO: Se añade un ID único y un array opcional para las versiones ---
// Esto nos permite anidar documentos y gestionarlos de forma única en el estado.
export interface ITTOItem {
    id: string; // ID único para cada item, esencial para React
    name: string;
    url: string;
    versions?: ITTOItem[]; // Array para almacenar las versiones anidadas
}

export interface IProcessStatus {
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}

export interface IProcessStage { // Para PMBOK
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}

export interface IScrumPhase { // Para Scrum
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}

interface IBaseProcess {
    id: number;
    process_number: number;
    name: string;
    status: IProcessStatus | null;
    kanban_status: KanbanStatus;
    // --- SIN CAMBIOS AQUÍ, PERO AHORA USARÁN LA NUEVA ESTRUCTURA DE ITTOItem ---
    inputs: ITTOItem[];
    tools_and_techniques: ITTOItem[];
    outputs: ITTOItem[];
}

export interface IPMBOKProcess extends IBaseProcess {
    type: 'pmbok';
    stage: IProcessStage | null;
}

export interface IScrumProcess extends IBaseProcess {
    type: 'scrum';
    phase: IScrumPhase | null;
}

export type AnyProcess = IPMBOKProcess | IScrumProcess;
