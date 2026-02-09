
import { ProficiencyLevel } from '../types';

export interface MasterclassLesson {
  id: string;
  title: string;
  description: string;
  level: ProficiencyLevel;
  content: string;
  icon: string;
}

export const MASTERCLASS_LESSONS: MasterclassLesson[] = [
  {
    id: 'master-huisarts',
    title: 'De Huisarts (El Médico)',
    description: 'Domina la cita médica y sobrevive a la cultura del paracetamol.',
    level: ProficiencyLevel.A2,
    icon: '🩺',
    content: `
[INTRODUCCIÓN]
¡Welkom! Hoy vamos a sincronizar tu neerlandés con uno de los pilares de la vida en Países Bajos: **De Huisarts** (el médico de cabecera). Si alguna vez has sentido que no te entienden o que "solo te dan paracetamol", esta lección es tu medicina. Vamos a aprender a describir el dolor y a navegar la consulta con confianza.

[FOCO FONÉTICO]
SUBIR MÚSICA - TONO ENFOCADO
El sonido más importante hoy es el diptongo **"UI"**. Para un hispanohablante, suena como una mezcla entre 'a' y 'u' muy cerrada. 
Repite conmigo: [Huis] (Casa). [Buik] (Vientre/Panza). [Uit] (Fuera). 
No es "huis" con 'u' española, es un sonido que viene del paladar. PAUSA.

[ANCLAJES LINGÜÍSTICOS]
Aquí tienes las frases de supervivencia. Escucha y repite:
1. [Ik heb last de mijn buik] - Tengo molestias en mi vientre. PAUSA.
2. [Sinds wanneer heeft u klachten?] - ¿Desde cuándo tiene quejas/síntomas? PAUSA.
3. [Ik voel me niet lekker] - No me siento bien. PAUSA.
4. [Is het ernstig?] - ¿Es grave? PAUSA.

[SYNC TIP]
**La Verdad sobre el Paracetamol**: En Holanda, el médico no te dará antibióticos por un resfriado. Se espera que tu cuerpo luche. Si el Huisarts te dice [Kijk het nog een weekje aan], significa "obsérvalo una semanita más". No es falta de cuidado, es confianza en tu sistema inmune. ¡No te enfades, es cultura!

[REPETICIÓN ACTIVA]
Vamos a practicar la intensidad del dolor. Repite:
- [Een beetje pijn] (Un poco de dolor). PAUSA.
- [Heel veel pijn] (Muchísimo dolor). PAUSA.
- [Ondraaglijke pijn] (Dolor insoportable). PAUSA.

[MINI-DIÁLOGO]
ESCENARIO: En la consulta.
Médico: [Wat kan ik voor u doen?] (¿Qué puedo hacer por usted?)
Tú: [Ik heb sinds twee dagen koorts en keelpijn.] (Tengo fiebre y dolor de garganta desde hace dos días).
Médico: [Laat me even kijken... Doe uw mond maar open.] (Déjeme ver... abra la boca).
Tú: [Is het een infectie?] (¿Es una infección?)
Médico: [Nee, het is een virus. Neem rust en een paracetamol.] (No, es un virus. Descanse y tome un paracetamol).

[CIERRE]
¡Excelente trabajo! Ya tienes las herramientas para tu próxima visita. Recuerda: la claridad es mejor que la gramática perfecta cuando te duele algo. 
**Tot de volgende keer!** (¡Hasta la próxima!)
`
  },
  {
    id: 'master-supermarkt',
    title: 'Supermarkt Survival',
    description: 'Aprende a preguntar por productos y entender las ofertas de Albert Heijn.',
    level: ProficiencyLevel.A1,
    icon: '🛒',
    content: `
[INTRODUCCIÓN]
¿Perdido entre el **Hagelslag** y el **Stroopwafel**? Hoy vamos a dominar el supermercado holandés.

[ANCLAJES LINGÜÍSTICOS]
- [Waar kan ich de melk vinden?] (¿Dónde puedo encontrar la leche?). PAUSA.
- [Heeft u een bonuskaart?] (¿Tiene tarjeta de descuento?). PAUSA.
- [Alstublieft] (Aquí tiene / Por favor). PAUSA.

[SYNC TIP]
**Zelfscannen**: Los holandeses aman la eficiencia. Usa las pistolas de auto-escaneo, pero ten cuidado: hay controles aleatorios llamados [Steekproef]. ¡No entres en pánico si te toca uno!
`
  }
];
