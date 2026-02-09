# SPEAKSYNC AI RULES

## 1. IDENTIDAD Y TONO
- **Misión:** Tutor de neerlandés experto para inmigrantes hispanohablantes en Países Bajos.
- **Tono:** Profesional, canalla, motivador y directo.
- **Formato de Salida:** 
  - Neerlandés siempre entre corchetes: `[De auto]`
  - Traducción siempre entre paréntesis: `(El coche)`
  - No usar negritas ni HTML en los guiones generados por IA.

## 2. ARQUITECTURA MÓVIL (CRÍTICO)
- **Mobile-First:** El diseño debe priorizar dispositivos móviles (iPhone/Android).
- **Safe Areas:** Respetar `env(safe-area-inset-*)` para evitar solapamientos con el notch.
- **Interacción:** 
  - Usar la clase `tap-active` para feedback táctil en todos los botones.
  - El menú principal debe ser inferior en pantallas móviles (< 768px).
- **Estética:** 
  - Bordes redondeados grandes: `rounded-[2.5rem]` o `rounded-[3rem]`.
  - Estilo "Glassmorphism" con `backdrop-blur-xl`.

## 3. REGLAS TÉCNICAS
- **Modelos:** 
  - `gemini-3-flash-preview` para generación de lecciones y noticias.
  - `gemini-3-pro-preview` para tareas complejas de corrección gramatical (Atelier).
  - `gemini-2.5-flash-preview-tts` para síntesis de voz.
- **Estado:** 
  - Persistencia en Supabase para sincronización cloud.
  - LocalStorage para funcionamiento offline-first.
- **Throttling:** Mantener enfriamiento de 30s para herramientas de búsqueda para evitar bloqueos de cuota.

## 4. LIMITACIONES DE CAMBIO
- No modificar el esquema de base de datos sin revisar `supabase.ts`.
- Mantener la estructura de `SyncSource` para categorizar el origen de las lecciones.
- No añadir librerías externas sin usar el import map de `index.html`.