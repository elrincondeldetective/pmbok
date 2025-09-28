// frontend/src/types/process.ts

export type KanbanStatus = 'unassigned' | 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

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

// AÑADIDO: Interfaz para las Fases de Scrum (aunque sea igual a Stage, es conceptualmente distinta)
export interface IScrumPhase {
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}


export interface IPMBOKProcess {
    id: number;
    process_number: number;
    name: string;
    status: IProcessStatus | null;
    stage: IProcessStage | null;
    kanban_status: KanbanStatus;
    inputs: string;
    tools_and_techniques: string;
    outputs: string;
}

// CAMBIO: La interfaz de Scrum ahora usa 'phase'
export interface IScrumProcess {
    id: number;
    process_number: number;
    name: string;
    status: IProcessStatus | null;
    phase: IScrumPhase | null; // Cambiado de 'stage' a 'phase'
    inputs: string;
    tools_and_techniques: string;
    outputs: string;
}

export type AnyProcess = IPMBOKProcess | IScrumProcess;
