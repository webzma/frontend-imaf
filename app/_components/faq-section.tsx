"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    question: "¿Cómo me registro en IMAF?",
    answer:
      'Haz clic en el botón "Comenzar Gratis" o "Registrarse" en la parte superior. Solo necesitas tu correo electrónico y crear una contraseña. El proceso toma menos de un minuto.',
  },
  {
    question: "¿Los cursos son gratuitos?",
    answer:
      "Sí, todos los cursos en IMAF son completamente gratuitos para estudiantes. Puedes inscribirte en tantos cursos como desees sin ningún costo.",
  },
  {
    question: "¿Puedo estudiar a mi propio ritmo?",
    answer:
      "Absolutamente. Los cursos están disponibles 24/7 y no tienen fechas límite estrictas. Puedes avanzar según tu disponibilidad y pausar cuando lo necesites.",
  },
  {
    question: "¿Cómo funciona el sistema de certificados?",
    answer:
      "Al completar todas las lecciones y aprobar las evaluaciones de un curso, recibirás automáticamente un certificado digital que puedes descargar y compartir en tus redes profesionales.",
  },
  {
    question: "¿Puedo ver mi progreso en los cursos?",
    answer:
      "Sí, tu panel de estudiante muestra métricas detalladas de tu progreso: porcentaje completado, calificaciones, tiempo dedicado y próximas actividades. Todo actualizado en tiempo real.",
  },
  {
    question: "¿Qué pasa si tengo dudas sobre el contenido?",
    answer:
      "Cada curso tiene un espacio de discusión donde puedes hacer preguntas. Los profesores y otros estudiantes pueden ayudarte. También puedes contactar directamente al profesor del curso.",
  },
  {
    question: "¿Puedo acceder desde mi celular?",
    answer:
      "Sí, IMAF está optimizada para funcionar en cualquier dispositivo: computadora, tablet o smartphone. Tu progreso se sincroniza automáticamente entre todos tus dispositivos.",
  },
  {
    question: "¿Necesito conocimientos previos?",
    answer:
      "Depende del curso. Cada curso indica claramente los requisitos previos en su descripción. Tenemos cursos desde nivel básico hasta avanzado en diferentes áreas.",
  },
];

export function FAQSection() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQ_ITEMS.map((item, i) => (
        <AccordionItem
          key={i}
          value={`faq-${i}`}
          className="bg-surface-container-lowest rounded-sm mb-3 px-6 border-none"
        >
          <AccordionTrigger className="text-on-surface font-sans font-medium text-base hover:no-underline py-5">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            <p>{item.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
