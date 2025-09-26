// frontend/src/types/process.ts
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
    // CAMBIO: Añadir el nuevo estado Kanban al tipo
    kanban_status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
    inputs: string;
    tools_and_techniques: string;
    outputs: string;
}
