// frontend/src/types/process.ts

export type KanbanStatus = 'unassigned' | 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export interface ITTOItem {
    id: string; // ID único para cada item, esencial para React
    name: string;
    url: string;
    isActive?: boolean; // Flag para marcar la versión activa
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

export interface Country {
    code: string;
    name: string;
}

// Representa el objeto de personalización que viene anidado en la respuesta de la API.
export interface IProcessCustomization {
    id: number;
    country_code: string;
    inputs: ITTOItem[];
    tools_and_techniques: ITTOItem[];
    outputs: ITTOItem[];
    // ===== CAMBIO: AÑADIR EL ESTADO KANBAN =====
    kanban_status: KanbanStatus;
}


// --- INTERFAZ BASE MODIFICADA ---
// Ahora contiene un array `customizations` en lugar de un único objeto opcional.
interface IBaseProcess {
    id: number;
    process_number: number;
    name: string;
    status: IProcessStatus | null;
    kanban_status: KanbanStatus;

    // Estos son los ITTOs base.
    inputs: ITTOItem[];
    tools_and_techniques: ITTOItem[];
    outputs: ITTOItem[];

    // Un proceso ahora puede tener múltiples personalizaciones, una para cada país.
    customizations: IProcessCustomization[];
    
    // Propiedad del lado del cliente para rastrear la personalización activa en el modal.
    activeCustomization?: IProcessCustomization;
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
