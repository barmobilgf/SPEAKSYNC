
import React from 'react';
import { Target, Heart, Zap, ShieldCheck, Users, Globe } from 'lucide-react';

const Philosophy: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 dark:border-slate-700 animate-fade-in">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
          La Filosofía <span className="text-orange-500">SPEAKSYNC</span>
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          No enseñamos idiomas para aprobar exámenes, los enseñamos para que puedas <span className="font-bold text-orange-600 dark:text-orange-400">sincronizar</span> tu vida con tu nuevo hogar.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold dark:text-white">Fricción Cero</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Eliminamos las barreras del aprendizaje tradicional. Micro-lecciones diseñadas para el inmigrante que no tiene tiempo, pero sí urgencia.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold dark:text-white">Enfoque Familiar</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Especialmente diseñado para familias hispanohablantes. Desde entender al pediatra hasta las reuniones en la escuela de tus hijos.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold dark:text-white">Puente Cultural</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            No solo traducimos palabras, traducimos la "holandidad". Explicamos el porqué detrás de cada interacción social y trámite legal.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold dark:text-white">Survival Learning</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Priorizamos lo que necesitas mañana por la mañana en el ayuntamiento antes que la gramática abstracta. El idioma es tu herramienta de supervivencia.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold dark:text-white">Confianza Real</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            IA diseñada para ser empática. SPEAKSYNC sabe que tienes miedo a equivocarte y está aquí para darte el guion perfecto antes de que abras la boca.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-400">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold dark:text-white">Integración Total</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Nuestra meta es que dejes de usarnos. Queremos que te sientas tan integrado que SPEAKSYNC sea solo un buen recuerdo de tu llegada a Holanda.
          </p>
        </div>
      </div>

      <div className="mt-16 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800 text-center">
        <p className="text-orange-800 dark:text-orange-200 font-medium italic">
          "Próximamente expandiremos nuestro soporte a inmigrantes de otras naciones, manteniendo siempre nuestra promesa de sincronización total."
        </p>
      </div>
    </div>
  );
};

export default Philosophy;
