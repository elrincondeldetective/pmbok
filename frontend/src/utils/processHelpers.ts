// /webapps/erd-ecosystem/apps/pmbok/frontend/src/utils/processHelpers.ts
import { AnyProcess, IProcessCustomization } from '../types/process';

/**
 * Fusiona el proceso base con la personalización del país activo (si existe).
 * Esta función es pura: entra data -> sale data procesada.
 */
export const mergeProcessData = (
  baseProcess: AnyProcess,
  countryCode?: string
): AnyProcess => {
  // 1. Si no hay país seleccionado, devolvemos el base limpio
  if (!countryCode) {
    return { ...baseProcess, activeCustomization: undefined };
  }

  // 2. Buscamos si existe personalización para ese país
  // Normalizamos a minúsculas para evitar errores de tipeo (co vs CO)
  const customization = baseProcess.customizations?.find(
    (c) => c.country_code.toLowerCase() === countryCode.toLowerCase()
  );

  // 3. Si encontramos match, fusionamos los datos
  if (customization) {
    return {
      ...baseProcess,
      inputs: customization.inputs,
      tools_and_techniques: customization.tools_and_techniques,
      outputs: customization.outputs,
      activeCustomization: customization, // Guardamos la ref para saber que está activo
    };
  }

  // 4. Si hay país pero no customization, devolvemos base (fallback)
  return { ...baseProcess, activeCustomization: undefined };
};