// frontend/src/types/process.ts

// Tipo para los estados de Kanban (sin cambios)
export type KanbanStatus = 'unassigned' | 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

// Interfaz para el Estatus de un proceso (sin cambios)
export interface IProcessStatus {
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}

// Interfaz para la Etapa de un proceso (sin cambios)
export interface IProcessStage {
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}

// Interfaz para un proceso de PMBOK (kanban_status es específico de PMBOK)
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

// NUEVA INTERFAZ: para un proceso de Scrum
export interface IScrumProcess {
    id: number;
    process_number: number;
    name: string;
    status: IProcessStatus | null;
    stage: IProcessStage | null;
    inputs: string;
    tools_and_techniques: string;
    outputs: string;
}

// TIPO UNIFICADO: para usar en componentes genéricos como la tarjeta
export type AnyProcess = IPMBOKProcess | IScrumProcess;
