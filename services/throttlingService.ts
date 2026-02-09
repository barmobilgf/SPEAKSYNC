
/**
 * SPEAKSYNC Throttling Service
 * Gestiona los tiempos de espera entre llamadas a herramientas costosas (Google Search/Maps).
 */

type ToolKey = 'news_search' | 'civic_search' | 'roleplay_engine';

interface ThrottlingState {
  lastExecution: number;
}

const state: Record<string, ThrottlingState> = {};

// Cooldown por defecto de 30 segundos para búsquedas
const DEFAULT_COOLDOWN = 30000;

export const throttlingService = {
  /**
   * Verifica si una herramienta está bloqueada por enfriamiento.
   */
  isThrottled(key: ToolKey, cooldown: number = DEFAULT_COOLDOWN): boolean {
    const now = Date.now();
    const last = state[key]?.lastExecution || 0;
    return (now - last) < cooldown;
  },

  /**
   * Obtiene los segundos restantes de enfriamiento.
   */
  getRemainingSeconds(key: ToolKey, cooldown: number = DEFAULT_COOLDOWN): number {
    const now = Date.now();
    const last = state[key]?.lastExecution || 0;
    const remaining = cooldown - (now - last);
    return Math.max(0, Math.ceil(remaining / 1000));
  },

  /**
   * Registra una ejecución exitosa de la herramienta.
   */
  recordExecution(key: ToolKey) {
    state[key] = { lastExecution: Date.now() };
  }
};
