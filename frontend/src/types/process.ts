// frontend/src/types/process.ts
// CAMBIO 1: Añadir un tipo específico para los estados Kanban
export type KanbanStatus = 'unassigned' | 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export interface IProcessStatus {
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}

export interface IProcessStage {
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}

export interface IProcess {
    id: number;
    process_number: number;
    name: string;
    status: IProcessStatus | null;
    stage: IProcessStage | null;
    // CAMBIO 2: Usar el nuevo tipo y añadir 'unassigned'
    kanban_status: KanbanStatus;
    inputs: string;
    tools_and_techniques: string;
    outputs: string;
}