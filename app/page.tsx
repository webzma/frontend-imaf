import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  BarChart3,
  Award,
  Clock,
  Target,
  Phone,
  MapPin,
  Instagram,
  BadgeCheck,
} from "lucide-react";
import { FAQSection } from "./_components/faq-section";
import { LandingNav } from "./_components/landing-nav";
import LogoImaf from "@/public/logo-imaf.webp";
import imgHero from "@/public/image-hero.webp";

/**
 * Hechos verificables sobre la oferta, no métricas.
 *
 * TODO(IMAF): si la institución confirma cifras reales (personas inscritas,
 * cursos impartidos, horas de formación), sustituir esta franja por ellas.
 * Hasta entonces no se publica ningún número: antes había tres "+X" literales
 * y un "500+" sin respaldo en una web institucional.
 */
const hechos = [
  { titulo: "Presencial", detalle: "Clases en nuestra sede" },
  { titulo: "Gratuitos y con costo", detalle: "Según el programa" },
  { titulo: "Pago fraccionado", detalle: "Total o en cuotas" },
  { titulo: "Certificación", detalle: "Al completar el curso" },
];

const beneficios = [
  {
    icon: Clock,
    title: "Inscripción rápida y sin filas",
    description:
      "Reserva tu cupo en línea a cualquier hora, sin desplazarte hasta la sede para gestionar papeles.",
  },
  {
    icon: BarChart3,
    title: "Gestión clara de tu cupo",
    description:
      "Consulta el estado de tu inscripción, descarga comprobantes y mantén a mano la información de tu aula y horario asignado.",
  },
  {
    icon: Award,
    title: "Certificación con validez oficial",
    description:
      "Al completar tu curso presencial, obtén un certificado que respalda tus competencias y fortalece tu perfil laboral o emprendedor.",
  },
  {
    icon: Target,
    title: "Formación con propósito",
    description:
      "Aprende en un espacio seguro y accesible, diseñado para empoderar a la mujer, fortalecer a la familia y mejorar tu empleabilidad.",
  },
];

const pasos = [
  {
    numero: "01",
    title: "Elige tu curso",
    description:
      "Explora la oferta formativa IMAF: cursos gratuitos para comunidades y cursos con costo, en oficios, emprendimiento y desarrollo personal.",
  },
  {
    numero: "02",
    title: "Inscríbete y paga a tu ritmo",
    description:
      "Completa tu registro en línea. Paga el total o fracciona tu inscripción en cuotas. Recibe confirmación inmediata con los detalles de tu cupo.",
  },
  {
    numero: "03",
    title: "Asiste, aprende y certifícate",
    description:
      "Acude a nuestra sede en los horarios asignados. Vive una experiencia presencial práctica y obtén tu certificado.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <LandingNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 pt-8 md:pt-20 pb-28 lg:pt-28 lg:pb-36 relative">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
            <div className="lg:col-span-7 space-y-10">
              <span className="font-sans text-xs uppercase tracking-widest text-primary font-semibold">
                Tu puerta a la formación IMAF
              </span>

              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] tight-tracking text-on-surface leading-[1.05]">
                  Inscríbete en línea.
                  <br />
                  {/* El énfasis lo carga el color, no la itálica. */}
                  <span className="text-primary">Aprende presencialmente.</span>
                </h1>
                <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-lg">
                  Reserva y paga tu curso en esta web. Asiste a nuestras clases
                  en la institución, aprende con metodología práctica y recibe
                  tu certificado. Cursos gratuitos y con costo para mujeres,
                  familias y todos quienes buscan crecer.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="bg-primary text-primary-foreground rounded-md px-8 py-4 ambient-shadow hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-2.5 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Crear cuenta
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="bg-surface-container-lowest text-on-surface rounded-md px-8 py-4 ambient-shadow hover:bg-surface-container transition-colors inline-flex items-center justify-center font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Iniciar sesión
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative hidden lg:block pt-4">
              <div className="relative rounded-lg overflow-hidden ambient-shadow aspect-4/5">
                <Image
                  src={imgHero}
                  alt="Estudiantes del IMAF durante una clase presencial"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 0vw, 40vw"
                  priority
                />
              </div>
              {/* Antes decía "500+ egresados certificados", una cifra sin
                  respaldo. Ahora afirma solo lo que la institución sí ofrece. */}
              <div className="absolute -bottom-6 -left-6 bg-surface-container-lowest rounded-lg p-5 ambient-shadow flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-primary-container flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-6 h-6 text-on-primary-container" />
                </div>
                <div>
                  <p className="font-sans font-semibold text-on-surface">
                    Certificación oficial
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Al completar tu curso
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Franja de hechos ── */}
      <section className="relative -mt-14 z-10 pb-0 md:pb-8">
        <div className="max-w-5xl mx-auto px-6 lg:px-16">
          <ul className="bg-surface-container-lowest rounded-lg ambient-shadow grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden">
            {hechos.map((h) => (
              <li
                key={h.titulo}
                className="bg-surface-container-lowest py-8 px-6 text-center outline outline-outline-variant"
              >
                <p className="font-serif text-2xl lg:text-[1.75rem] tight-tracking text-primary leading-tight">
                  {h.titulo}
                </p>
                <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground mt-2">
                  {h.detalle}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Beneficios ── */}
      <section id="beneficios" className="bg-surface-container-low py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="max-w-2xl mb-20 space-y-4">
            <span className="font-sans text-xs uppercase tracking-widest text-primary font-semibold">
              Beneficios
            </span>
            <h2 className="text-4xl lg:text-6xl tight-tracking text-on-surface leading-tight">
              Beneficios de formarte en{" "}
              <span className="text-primary">IMAF</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              Gestiona todo en línea y vive una experiencia presencial de
              calidad. Cada paso está pensado para que accedas a formación real,
              certificados válidos y oportunidades concretas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tarjeta destacada: sin foto de stock. El peso lo carga la
                tipografía y el color de marca, y de paso rompe la simetría. */}
            <div className="lg:row-span-2 bg-primary text-primary-foreground rounded-lg overflow-hidden flex flex-col justify-between p-10 ambient-shadow">
              <div className="w-14 h-14 rounded-md bg-primary-foreground/15 flex items-center justify-center mb-8">
                <BookOpen className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-3xl lg:text-4xl mb-4 leading-tight">
                  Amplia oferta formativa
                </h3>
                <p className="leading-relaxed text-primary-foreground/85">
                  Cursos prácticos en oficios, emprendimiento y desarrollo
                  personal. Elige la formación que se ajuste a tus metas y a tu
                  realidad.
                </p>
              </div>
            </div>

            {beneficios.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-surface-container-lowest rounded-lg p-8 space-y-4 group ambient-shadow"
                >
                  <div className="w-12 h-12 rounded-md bg-surface-container-high flex items-center justify-center group-hover:bg-primary-container transition-colors">
                    <Icon className="w-6 h-6 text-muted-foreground group-hover:text-on-primary-container transition-colors" />
                  </div>
                  <h3 className="text-2xl text-on-surface">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ──
          Lista editorial numerada a ancho completo en vez de tres tarjetas
          gemelas centradas: rompe el ritmo de plantilla y elimina las tres
          fotos de stock y los números sobre imagen que no se leían. */}
      <section id="como-funciona" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="max-w-2xl mb-16 space-y-4">
            <span className="font-sans text-xs uppercase tracking-widest text-primary font-semibold">
              Cómo funciona
            </span>
            <h2 className="text-4xl lg:text-6xl tight-tracking text-on-surface leading-tight">
              Tres pasos
            </h2>
            <p className="text-lg text-muted-foreground">
              Gestiona todo en línea y asiste presencialmente a nuestra sede.
              Sin complicaciones, sin filas.
            </p>
          </div>

          <ol className="space-y-px">
            {pasos.map((paso) => (
              <li
                key={paso.numero}
                className="grid md:grid-cols-12 gap-4 md:gap-10 py-10 border-t border-outline-variant last:border-b"
              >
                <span
                  aria-hidden="true"
                  className="md:col-span-2 font-serif text-5xl lg:text-6xl tight-tracking text-primary leading-none"
                >
                  {paso.numero}
                </span>
                <h3 className="md:col-span-4 text-2xl lg:text-3xl text-on-surface leading-tight">
                  {paso.title}
                </h3>
                <p className="md:col-span-6 text-muted-foreground leading-relaxed lg:text-lg">
                  {paso.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-surface-container-low py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-28 lg:self-start">
              <span className="font-sans text-xs uppercase tracking-widest text-primary font-semibold">
                FAQ
              </span>
              <h2 className="text-4xl lg:text-5xl tight-tracking text-on-surface leading-tight">
                Preguntas
                <br />
                frecuentes
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                ¿Tienes dudas? Aquí respondemos las más comunes.
              </p>
            </div>
            <div className="lg:col-span-8">
              <FAQSection />
            </div>
          </div>
        </div>
      </section>

      {/* ── Misión y visión ── */}
      <section className="bg-surface py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="max-w-3xl mb-16 space-y-4">
            <span className="font-sans text-xs uppercase tracking-widest text-primary font-semibold">
              Nuestro compromiso institucional
            </span>
            <h2 className="text-4xl lg:text-6xl tight-tracking text-on-surface leading-tight">
              Formación, derechos y oportunidades{" "}
              <span className="text-primary">
                reales para el Municipio Independencia
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="bg-surface-container-low rounded-lg p-8 lg:p-10 ambient-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                  <Target className="w-6 h-6 text-on-primary-container" />
                </div>
                <h3 className="text-2xl lg:text-3xl text-on-surface">Misión</h3>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Formar, proteger y empoderar a las mujeres y familias del
                Municipio Independencia, Yaracuy, mediante programas integrales
                de atención, prevención y capacitación. Promovemos la igualdad
                de género, el cuidado de la maternidad y la corresponsabilidad
                familiar, en estricto cumplimiento de la ley y los derechos
                fundamentales.
              </p>
            </div>

            <div className="bg-surface-container-low rounded-lg p-8 lg:p-10 ambient-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center">
                  <Award className="w-6 h-6 text-on-secondary-container" />
                </div>
                <h3 className="text-2xl lg:text-3xl text-on-surface">Visión</h3>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Ser el instituto referente en Yaracuy en la defensa y promoción
                de los derechos de la mujer y la familia, reconocido por la
                calidad, el impacto social y la innovación de sus servicios.
                Construimos, día a día, una comunidad más justa, equitativa y
                libre de violencia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="bg-surface-container-low py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 lg:px-16 text-center space-y-8">
          <span className="font-sans text-xs uppercase tracking-widest text-primary font-semibold">
            Inscripciones abiertas
          </span>
          <h2 className="text-4xl lg:text-7xl tight-tracking text-on-surface leading-tight">
            Tu futuro <span className="text-primary">empieza hoy</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Regístrate en línea, asegura tu cupo presencial y avanza con
            formación práctica y certificación.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/register"
              className="bg-primary text-primary-foreground rounded-md px-10 py-4 ambient-shadow hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-2.5 font-medium text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Crear cuenta
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="bg-surface-container-lowest text-on-surface rounded-md px-10 py-4 ambient-shadow hover:bg-surface-container transition-colors inline-flex items-center justify-center font-medium text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-surface-container-low py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="grid md:grid-cols-11 gap-12 mb-12">
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-2.5">
                <Image src={LogoImaf} alt="" width={24} height={24} />
                <span className="text-xl font-semibold text-on-surface">
                  IMAF
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Instituto público dedicado a la formación práctica de la mujer,
                la familia y el desarrollo laboral. Cursos presenciales,
                accesibles y con certificación oficial.
              </p>
            </div>
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-semibold text-on-surface">
                Estudiantes
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/register"
                    className="hover:text-primary transition-colors"
                  >
                    Crear cuenta
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-primary transition-colors"
                  >
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link
                    href="#beneficios"
                    className="hover:text-primary transition-colors"
                  >
                    Beneficios
                  </Link>
                </li>
              </ul>
            </div>
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-semibold text-on-surface">
                Recursos
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#como-funciona"
                    className="hover:text-primary transition-colors"
                  >
                    Cómo funciona
                  </Link>
                </li>
                <li>
                  <Link
                    href="#faq"
                    className="hover:text-primary transition-colors"
                  >
                    Preguntas frecuentes
                  </Link>
                </li>
              </ul>
            </div>
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-semibold text-on-surface">
                Contacto
              </h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <a
                      href="https://wa.me/584121512141"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      +58 412-151 21 41
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      WhatsApp
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Instagram className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <a
                      href="https://www.instagram.com/imaf_independencia?igsh=MXBoMnJrOHJ5aHk2aw=="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      @imaf_independencia
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      Instagram
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-muted-foreground">
                      5ta av. entre calles 29 y 30.
                      <br />
                      Antigua sede de la Unidad de Diálisis.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dirección
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-outline-variant pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Alcaldía de Independencia. Todos los
              derechos reservados. | Instituto de la Mujer, Atención a la
              Familia y Formación para el Trabajo (IMAF)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
