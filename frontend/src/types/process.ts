// frontend/src/types/process.ts

export type KanbanStatus = 'unassigned' | 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

// --- NUEVA INTERFAZ ---
// Define la estructura de cada item en las listas de Entradas, Herramientas y Salidas.
export interface ITTOItem {
    name: string;
    url: string;
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
    // --- CAMBIO: Los campos ahora son un array del nuevo tipo ITTOItem ---
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
