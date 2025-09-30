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

// ===== INICIO: NUEVA INTERFAZ PARA LA PERSONALIZACIÓN =====
// Representa el objeto `customization` que ahora viene anidado en la respuesta de la API
// cuando se selecciona un país.
export interface IProcessCustomization {
    id: number;
    country_code: string;
    inputs: ITTOItem[];
    tools_and_techniques: ITTOItem[];
    outputs: ITTOItem[];
}
// ===== FIN: NUEVA INTERFAZ =====


// ===== INICIO: INTERFAZ BASE MODIFICADA =====
// Se elimina `country_code` del nivel superior y se añade el objeto opcional `customization`.
interface IBaseProcess {
    id: number;
    process_number: number;
    name: string;
    status: IProcessStatus | null;
    kanban_status: KanbanStatus;

    // Estos son los ITTOs base, que pueden ser sobreescritos por los de la personalización.
    inputs: ITTOItem[];
    tools_and_techniques: ITTOItem[];
    outputs: ITTOItem[];

    // El objeto de personalización es opcional. Solo existirá si se pide un país
    // y hay una personalización guardada para ese proceso y país.
    customization?: IProcessCustomization | null;
}
// ===== FIN: INTERFAZ BASE MODIFICADA =====

export interface IPMBOKProcess extends IBaseProcess {
    type: 'pmbok';
    stage: IProcessStage | null;
}

export interface IScrumProcess extends IBaseProcess {
    type: 'scrum';
    phase: IScrumPhase | null;
}

export type AnyProcess = IPMBOKProcess | IScrumProcess;