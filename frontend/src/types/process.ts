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

export interface IScrumPhase { // Para Scrum
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}

// Interfaz Base para campos comunes
interface IBaseProcess {
    id: number;
    process_number: number;
    name: string;
    status: IProcessStatus | null;
    kanban_status: KanbanStatus;
    inputs: string;
    tools_and_techniques: string;
    outputs: string;
}

// IPMBOKProcess ahora extiende la base y añade sus campos específicos
export interface IPMBOKProcess extends IBaseProcess {
    type: 'pmbok'; // Campo discriminador
    stage: IProcessStage | null;
}

// IScrumProcess ahora extiende la base y añade sus campos específicos
export interface IScrumProcess extends IBaseProcess {
    type: 'scrum'; // Campo discriminador
    phase: IScrumPhase | null; 
}

// Tipo de Unión para cualquier tipo de proceso
export type AnyProcess = IPMBOKProcess | IScrumProcess;
