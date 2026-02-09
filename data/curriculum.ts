
import { CurriculumLevel, ProficiencyLevel, Module, Chapter } from '../types';

const generateChapters = (moduleId: string, moduleTitle: string): Chapter[] => {
  const chapters: Chapter[] = [];
  for (let i = 1; i <= 5; i++) {
    chapters.push({
      id: `${moduleId}-c${i}`,
      title: `Lección ${i}: ${moduleTitle}`,
      description: `Entrenamiento práctico y vocabulario clave sobre ${moduleTitle.toLowerCase()}.`
    });
  }
  chapters.push({
    id: `${moduleId}-exam`,
    title: `Examen de Maestría: ${moduleTitle}`,
    description: `Demuestra que dominas los conceptos de este bloque para avanzar.`,
    isExam: true
  });
  return chapters;
};

const getThemesForLevel = (level: ProficiencyLevel): string[] => {
  const themesA1 = [
    "Primeros Saludos", "Cifras y Dinero (Euros)", "El Alfabeto y Fonética", "La Familia", "Colores y Ropa",
    "La Casa y Habitaciones", "Días y Meses", "La Hora y Citas", "En el Supermercado (AH/Jumbo)", "Transporte: El Tren (NS)",
    "Transporte: La Bicicleta", "Partes del Cuerpo", "Sentimientos Básicos", "Clima Holandés", "Comida y Bebida",
    "Restaurantes y Cafés", "Hobbys y Deporte", "La Ciudad y Direcciones", "Compras en el Centrum", "Profesiones Comunes",
    "La Escuela de los Niños", "Visita al Médico (Huisarts)", "Animales y Mascotas", "Rutina Diaria", "Vacaciones y Viajes",
    "Países y Nacionalidades", "Gramática: Presente", "Gramática: Artículos (De/Het)", "Gramática: Plurales", "Cultura: El Cumpleaños Holandés"
  ];

  const themesA2 = [
    "Presentación Detallada", "Experiencia Laboral", "Vivienda: Alquiler (Huur)", "El Vecindario (Buurt)", "Servicios Públicos (Gas/Luz)",
    "Trámites en el Gemeente", "El BSN y Documentación", "Salud: Emergencias", "Salud: La Farmacia (Apotheek)", "Crianza: El Consultatiebureau",
    "Educación: Basisschool", "Hacer Amigos (Borrel)", "Invitaciones Sociales", "Hacer Compras Online", "El Mercado Semanal",
    "Transporte: OV-Chipkaart", "Seguros de Salud", "Trámites de Residencia", "Gramática: Pasado Simple", "Gramática: Adjetivos",
    "Cultura: Sinterklaas", "Cultura: Koningsdag", "Naturaleza y Parques", "Medios de Comunicación", "Internet y Apps Útiles",
    "Bancos y Tarjetas (iDEAL)", "Correos y Paquetes", "Limpieza y Reciclaje", "Ropa de Invierno/Lluvia", "Planear una Fiesta"
  ];

  const themesB1 = [
    "Entrevistas de Trabajo", "Contratos Laborales", "Derechos del Trabajador", "Impuestos (Belastingdienst)", "Comprar una Casa (Koopwoning)",
    "Hipotecas y Gastos", "El Sistema Educativo (Middelbare)", "Participación Ciudadana", "Voluntariado (Vrijwilligerswerk)", "Debate: Medio Ambiente",
    "Sostenibilidad en Holanda", "Historia de los Tulipanes", "El Siglo de Oro", "Problemas de Vivienda", "Inmigración e Integración",
    "El Examen de Inburgering", "Medicina Especializada", "Estilo de Vida Saludable", "Viajes por Europa", "Arte: Van Gogh y Rembrandt",
    "Arquitectura Moderna", "Opinión sobre Política", "El Sistema de Gobierno", "Leyes de Tráfico", "Seguridad Social",
    "Gestión del Tiempo", "Cultura: La 'Directez' Holandesa", "Negociación Básica", "Redacción de Emails", "Presentaciones en el Trabajo"
  ];

  const themesB2 = [
    "Liderazgo en la Oficina", "Gestión de Conflictos", "Psicología Social", "El Mercado Inmobiliario Profundo", "Inversiones y Ahorro",
    "Análisis de Noticias", "Literatura Contemporánea", "Debates Éticos", "Inteligencia Artificial", "El Futuro del Trabajo",
    "Educación Superior (HBO/WO)", "Investigación Científica", "Sociología del Agua", "Ingeniería de Diques", "Derecho Civil",
    "Protección del Consumidor", "Relaciones Internacionales", "Filosofía Europea", "Crítica de Cine y Teatro", "Gastronomía de Vanguardia",
    "Turismo Sostenible", "Planificación Urbana", "Historia de las Colonias", "Derechos Humanos", "Igualdad y Diversidad",
    "Marketing y Consumo", "Cambio Climático Local", "Energías Renovables", "El Idioma en el Siglo XXI", "Dialectos y Variaciones"
  ];

  const themesC1 = [
    "Retórica y Persuasión", "Análisis Académico", "Jerga Profesional Médica", "Jerga Legal y Contratos", "Literatura Clásica",
    "Poesía Neerlandesa", "Estrategia Empresarial", "Política de la UE", "Sociología de la Migración", "Ética Tecnológica",
    "Crítica de Arte Avanzada", "Debates Socioeconómicos", "Gestión de Crisis", "Periodismo de Investigación", "Religión y Sociedad",
    "Tradiciones en Extinción", "El Futuro de la Lengua", "Diplomacia y Protocolo", "Psicología Organizacional", "Sistemas de Justicia",
    "Innovación en Agricultura", "Urbanismo utópico", "Biología y Ecosistemas", "Astronomía y Espacio", "Finanzas Globales",
    "Cine Documental", "Teatro Experimental", "Semántica y Pragmática", "Filosofía del Lenguaje", "Maestría en el Discurso"
  ];

  const themesC2 = [
    "Niveles de Formalidad Extrema", "Sarcasmo e Ironía Cultural", "Literatura de la Edad Media", "Etimología del Neerlandés", "Filosofía Política Profunda",
    "Análisis Macro-Económico", "Derecho Internacional Público", "Neurociencia y Aprendizaje", "Antropología Urbana", "Ecología Profunda",
    "Crítica Literaria Teórica", "Discursos Históricos", "Geopolítica del Ártico", "Bioética Avanzada", "Teoría del Caos",
    "Física Cuántica y Sociedad", "Historia de la Cartografía", "Cultura Marítima Global", "Maestría en Negociación", "Dirección de Orquesta Social",
    "Arquitectura Funcionalista", "Sistemas de Pensamiento Complejo", "Lingüística Histórica", "Grandes Pensadores Holandeses", "El Concepto de 'Gezelligheid' Filosófico",
    "Vanguardismo Artístico", "Sociología del Ocio", "Futuro de la Unión Europea", "Identidad Post-Nacional", "El Legado de Erasmo de Rotterdam"
  ];

  switch(level) {
    case ProficiencyLevel.A1: return themesA1;
    case ProficiencyLevel.A2: return themesA2;
    case ProficiencyLevel.B1: return themesB1;
    case ProficiencyLevel.B2: return themesB2;
    case ProficiencyLevel.C1: return themesC1;
    case ProficiencyLevel.C2: return themesC2;
    default: return themesA1;
  }
};

const generateModules = (level: ProficiencyLevel): Module[] => {
  const modules: Module[] = [];
  const levelPrefix = level.split(' ')[0];
  const themes = getThemesForLevel(level);

  for (let i = 1; i <= 30; i++) {
    const id = `${levelPrefix}-m${i}`;
    const title = themes[i-1] || `Módulo ${i}: Tema Avanzado`;
    modules.push({
      id,
      title,
      chapters: generateChapters(id, title)
    });
  }
  return modules;
};

export const DUTCH_CURRICULUM: CurriculumLevel[] = [
  { level: ProficiencyLevel.A1, modules: generateModules(ProficiencyLevel.A1) },
  { level: ProficiencyLevel.A2, modules: generateModules(ProficiencyLevel.A2) },
  { level: ProficiencyLevel.B1, modules: generateModules(ProficiencyLevel.B1) },
  { level: ProficiencyLevel.B2, modules: generateModules(ProficiencyLevel.B2) },
  { level: ProficiencyLevel.C1, modules: generateModules(ProficiencyLevel.C1) },
  { level: ProficiencyLevel.C2, modules: generateModules(ProficiencyLevel.C2) },
];
