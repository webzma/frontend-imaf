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
      "Crea tu cuenta en esta plataforma con tu correo electrónico y una contraseña. Luego, explora los cursos disponibles, selecciona el que se ajuste a tus metas y completa tu inscripción. Si el curso tiene costo, podrás pagar en línea (total o por partes). Recibirás una confirmación con la sede, horario y requisitos para iniciar.",
  },
  {
    question: "¿Puedo gestionar mi inscripción desde el celular?",
    answer:
      "Sí. Nuestra plataforma está optimizada para móviles: puedes registrarte, explorar cursos, realizar pagos y descargar tu comprobante desde cualquier dispositivo. La experiencia de aprendizaje, sin embargo, es 100% presencial en nuestra sede.",
  },
  {
    question: "¿Los cursos son gratuitos?",
    answer:
      "IMAF ofrece ambas modalidades: cursos gratuitos para comunidades priorizadas y cursos con costo de tarifa accesible. Cada curso indica claramente su modalidad en la ficha informativa. Los pagos con costo pueden realizarse de contado o por partes.",
  },
  {
    question: "¿Cómo funciona el sistema de certificados?",
    answer:
      "Al completar todas las lecciones y aprobar las evaluaciones de un curso, recibirás automáticamente un certificado digital que puedes descargar y compartir en tus redes profesionales.",
  },
  {
    question: "¿Dónde se imparten los cursos?",
    answer:
      "Todos los cursos se dictan de forma presencial en nuestra sede IMAF: 5ta av. entre calles 29 y 30, antigua sede de la Unidad de Diálisis. Contamos con espacios accesibles, equipados y diseñados para el aprendizaje práctico. Te recomendamos llegar 15 minutos antes de tu primera clase.",
  },
  {
    question: "¿Los cursos tienen horarios fijos?",
    answer:
      "Sí. Cada curso tiene un cronograma definido (días y horarios) que se asigna al momento de confirmar tu cupo. Esta información está disponible en la información de los cursos. La asistencia es fundamental para aprovechar la metodología práctica y obtener tu certificación.",
  },
  {
    question: "¿Cómo funciona el sistema de certificados?",
    answer:
      "Al completar la asistencia requerida y aprobar las evaluaciones prácticas de tu curso presencial, recibirás un certificado oficial emitido por IMAF, con validez institucional. Podrás descargarlo desde tu cuenta o recogerlo en sede, según la modalidad que se indique al finalizar tu formación.",
  },
  {
    question: "¿Qué formas de pago aceptan?",
    answer:
      "Aceptamos pagos en Bolívares (Bs.), tanto en efectivo como en digital (transferencia bancaria o pago móvil). El método disponible se indica durante el proceso de inscripción y todos los pagos generan comprobante oficial.",
  },
  {
    question: "¿Necesito llevar materiales o equipos?",
    answer:
      "Depende del curso. Algunos requieren materiales para prácticas. Esta información está detallada en la ficha de cada curso: si se necesita material, se especifica qué llevar; si no se menciona, no es necesario Así evitas gastos innecesarios.",
  },
  {
    question: "¿Ofrecen reembolsos si no puedo tomar el curso?",
    answer:
      "Como institución pública, IMAF no realiza devoluciones de dinero por pagos de cursos. Sin embargo, entendemos que pueden surgir imprevistos, por lo que te ofrecemos la opción de trasladar tu pago a otro curso del mismo valor, sujeto a disponibilidad de cupos y previa coordinación con nuestra administración. Contáctanos con tiempo para gestionar el cambio.",
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
