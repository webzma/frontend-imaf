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
  CheckCircle2,
  MessageCircle,
  Heart,
} from "lucide-react";
import { FAQSection } from "./_components/faq-section";
import { LandingNav } from "./_components/landing-nav";
import { CursosAbiertos } from "./_components/cursos-abiertos";
import LogoImaf from "@/public/logo-imaf.webp";
import imgHero from "@/public/image-hero.webp";
import { SEDE } from "@/lib/modalidad";

/**
 * Lo que la institución ofrece, sin cifras.
 *
 * TODO(IMAF): si la institución confirma cifras reales (personas inscritas,
 * cursos impartidos, horas de formación), pueden añadirse. Hasta entonces no
 * se publica ningún número inventado.
 */
const garantias = [
  "Cursos gratuitos y con costo",
  "Pago total o en cuotas",
  "Certificado oficial",
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
      "Consulta el estado de tu inscripción, descarga comprobantes y ten a mano el horario de tus clases.",
  },
  {
    icon: Award,
    title: "Certificación con validez oficial",
    description:
      "Al completar tu curso presencial, obtén un certificado que respalda tus competencias y fortalece tu perfil laboral.",
  },
  {
    icon: Target,
    title: "Formación con propósito",
    description:
      "Aprende en un espacio seguro y accesible, pensado para empoderar a la mujer, fortalecer a la familia y mejorar tu empleabilidad.",
  },
];

const pasos = [
  {
    title: "Elige tu curso",
    description:
      "Explora la oferta: cursos gratuitos para comunidades y cursos con costo en oficios, emprendimiento y desarrollo personal.",
  },
  {
    title: "Inscríbete y paga a tu ritmo",
    description:
      "Regístrate en línea y paga el total o en cuotas. Te avisamos en cuanto la administración confirme tu cupo.",
  },
  {
    title: "Asiste, aprende y certifícate",
    description:
      "Acude a la sede en los horarios del curso, aprende con práctica real y descarga tu certificado al aprobar.",
  },
];

/** Clases compartidas de los botones de la portada. */
const btnPrimario =
  "inline-flex items-center justify-center gap-2.5 rounded-md bg-primary px-7 py-3.5 font-medium text-primary-foreground ambient-shadow transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none";
const btnSecundario =
  "inline-flex items-center justify-center gap-2.5 rounded-md bg-surface-container-lowest px-7 py-3.5 font-medium text-on-surface ambient-shadow transition-colors hover:bg-surface-container focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-sans text-xs font-semibold tracking-widest text-primary uppercase">
      {children}
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <LandingNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Manchas de color de fondo: dan profundidad sin foto de stock extra. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 size-[34rem] rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 -left-40 size-[26rem] rounded-full bg-secondary/5 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-6 pt-10 pb-20 md:pt-20 lg:px-16 lg:pt-24 lg:pb-28">
          <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="space-y-8 lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-container/70 px-3.5 py-1.5 font-sans text-xs font-semibold text-on-primary-container">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                Inscripciones abiertas · Clases presenciales
              </span>

              <div className="space-y-6">
                <h1 className="text-5xl leading-[1.05] tight-tracking text-on-surface sm:text-6xl lg:text-[4.5rem]">
                  Inscríbete en línea.
                  <br />
                  <span className="text-primary">Aprende presencialmente.</span>
                </h1>
                <p className="max-w-xl text-lg leading-relaxed text-muted-foreground lg:text-xl">
                  Reserva y paga tu curso en esta web, asiste a clases prácticas
                  en nuestra sede y recibe tu certificado. Formación para
                  mujeres, familias y todos quienes buscan crecer.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a href="#cursos" className={btnPrimario}>
                  Ver cursos disponibles
                  <ArrowRight className="size-4" />
                </a>
                <Link href="/register" className={btnSecundario}>
                  Crear cuenta
                </Link>
              </div>

              <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
                {garantias.map((g) => (
                  <li
                    key={g}
                    className="flex items-center gap-2 font-sans text-sm text-on-surface"
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>

            {/* Imagen: antes desaparecía en móvil y la portada quedaba en
                solo texto. Ahora se adapta a una proporción apaisada. */}
            <div className="relative lg:col-span-5">
              <div
                aria-hidden="true"
                className="absolute inset-0 hidden translate-x-4 translate-y-4 rounded-2xl border-2 border-primary/25 sm:block"
              />
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl ambient-shadow lg:aspect-[4/5]">
                <Image
                  src={imgHero}
                  alt="Estudiante del IMAF inscribiéndose desde su teléfono"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                />
              </div>

              <div className="absolute -bottom-6 left-4 flex items-center gap-3 rounded-lg bg-surface-container-lowest p-4 ambient-shadow sm:-left-6 sm:p-5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-container">
                  <BadgeCheck className="size-6 text-on-primary-container" />
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

              <div className="glass absolute top-4 right-4 hidden items-center gap-2 rounded-full bg-surface-container-lowest/85 px-3.5 py-2 ambient-shadow sm:flex lg:-right-4">
                <MapPin className="size-4 text-primary" />
                <span className="font-sans text-xs font-semibold text-on-surface">
                  Sede IMAF · Independencia, Yaracuy
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cursos abiertos ── */}
      <section id="cursos" className="bg-surface-container-low py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-16">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-4">
              <Eyebrow>Oferta formativa</Eyebrow>
              <h2 className="text-4xl leading-tight tight-tracking text-on-surface lg:text-6xl">
                Cursos con inscripciones{" "}
                <span className="text-primary">abiertas</span>
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Todos se dictan de forma presencial en nuestra sede. Crea tu
                cuenta para inscribirte y reportar tu pago.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex shrink-0 items-center gap-1.5 font-sans text-sm font-semibold text-primary hover:underline"
            >
              ¿Ya tienes cuenta? Ver el catálogo completo
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <CursosAbiertos />
        </div>
      </section>

      {/* ── Beneficios ── */}
      <section id="beneficios" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-16">
          <div className="mb-14 max-w-2xl space-y-4">
            <Eyebrow>Beneficios</Eyebrow>
            <h2 className="text-4xl leading-tight tight-tracking text-on-surface lg:text-6xl">
              Por qué formarte en <span className="text-primary">IMAF</span>
            </h2>
            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
              Gestionas todo en línea y vives una experiencia presencial de
              calidad: formación real, certificados válidos y oportunidades
              concretas.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="relative flex flex-col justify-between overflow-hidden rounded-lg bg-primary p-10 text-primary-foreground ambient-shadow lg:row-span-2">
              <BookOpen
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -bottom-10 size-64 text-primary-foreground/10"
              />
              <div className="mb-8 flex size-14 items-center justify-center rounded-md bg-primary-foreground/15">
                <BookOpen className="size-7" />
              </div>
              <div className="relative">
                <h3 className="mb-4 text-3xl leading-tight lg:text-4xl">
                  Amplia oferta formativa
                </h3>
                <p className="leading-relaxed text-primary-foreground/85">
                  Cursos prácticos en oficios, emprendimiento y desarrollo
                  personal. Elige la formación que se ajuste a tus metas y a tu
                  realidad.
                </p>
                <a
                  href="#cursos"
                  className="mt-8 inline-flex items-center gap-2 font-sans text-sm font-semibold underline-offset-4 hover:underline"
                >
                  Ver cursos abiertos
                  <ArrowRight className="size-4" />
                </a>
              </div>
            </div>

            {beneficios.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="space-y-4 rounded-lg bg-surface-container-lowest p-8 ambient-shadow transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex size-12 items-center justify-center rounded-md bg-primary-container">
                    <Icon className="size-6 text-on-primary-container" />
                  </div>
                  <h3 className="text-2xl text-on-surface">{b.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {b.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona: línea de tiempo ── */}
      <section
        id="como-funciona"
        className="bg-surface-container-low py-20 md:py-28"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-16">
          <div className="mb-16 max-w-2xl space-y-4">
            <Eyebrow>Cómo funciona</Eyebrow>
            <h2 className="text-4xl leading-tight tight-tracking text-on-surface lg:text-6xl">
              Tres pasos para empezar
            </h2>
            <p className="text-lg text-muted-foreground">
              Todo el trámite, en línea. El aprendizaje, en nuestra sede.
            </p>
          </div>

          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            {/* Línea que une los pasos (horizontal en escritorio, vertical en móvil). */}
            <div
              aria-hidden="true"
              className="absolute top-7 right-[16%] left-[16%] hidden h-px bg-outline-variant md:block"
            />
            <div
              aria-hidden="true"
              className="absolute top-7 bottom-7 left-7 w-px bg-outline-variant md:hidden"
            />
            {pasos.map((paso, i) => (
              <li
                key={paso.title}
                className="relative flex gap-6 md:flex-col md:items-center md:text-center"
              >
                <span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-sans text-xl font-semibold text-primary-foreground ring-8 ring-surface-container-low">
                  {i + 1}
                </span>
                <div className="space-y-2 md:max-w-xs">
                  <h3 className="text-2xl leading-tight text-on-surface">
                    {paso.title}
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {paso.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-16">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
            <div className="space-y-4 lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="text-4xl leading-tight tight-tracking text-on-surface lg:text-5xl">
                Preguntas
                <br />
                frecuentes
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                ¿Tienes dudas? Aquí respondemos las más comunes.
              </p>
              <div className="rounded-lg bg-surface-container-low p-5">
                <p className="font-sans text-sm font-semibold text-on-surface">
                  ¿No encuentras tu respuesta?
                </p>
                <p className="mt-1 font-sans text-sm text-muted-foreground">
                  Escríbenos y te ayudamos con tu inscripción.
                </p>
                <a
                  href="https://wa.me/584121512141"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 font-sans text-sm font-semibold text-primary hover:underline"
                >
                  <MessageCircle className="size-4" />
                  Escribir por WhatsApp
                </a>
              </div>
            </div>
            <div className="lg:col-span-8">
              <FAQSection />
            </div>
          </div>
        </div>
      </section>

      {/* ── Misión y visión ── */}
      <section className="bg-surface-container-low py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-16">
          <div className="mb-14 max-w-3xl space-y-4">
            <Eyebrow>Nuestro compromiso institucional</Eyebrow>
            <h2 className="text-4xl leading-tight tight-tracking text-on-surface lg:text-6xl">
              Formación, derechos y oportunidades{" "}
              <span className="text-primary">
                reales para el Municipio Independencia
              </span>
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
            {[
              {
                icon: Target,
                titulo: "Misión",
                tono: "bg-primary-container text-on-primary-container",
                texto:
                  "Formar, proteger y empoderar a las mujeres y familias del Municipio Independencia, Yaracuy, mediante programas integrales de atención, prevención y capacitación. Promovemos la igualdad de género, el cuidado de la maternidad y la corresponsabilidad familiar, en estricto cumplimiento de la ley y los derechos fundamentales.",
              },
              {
                icon: Heart,
                titulo: "Visión",
                tono: "bg-secondary-container text-on-secondary-container",
                texto:
                  "Ser el instituto referente en Yaracuy en la defensa y promoción de los derechos de la mujer y la familia, reconocido por la calidad, el impacto social y la innovación de sus servicios. Construimos, día a día, una comunidad más justa, equitativa y libre de violencia.",
              },
            ].map(({ icon: Icon, titulo, tono, texto }) => (
              <div
                key={titulo}
                className="rounded-lg border-l-4 border-primary bg-surface-container-lowest p-8 ambient-shadow lg:p-10"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className={`flex size-12 items-center justify-center rounded-full ${tono}`}
                  >
                    <Icon className="size-6" />
                  </div>
                  <h3 className="text-2xl text-on-surface lg:text-3xl">
                    {titulo}
                  </h3>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 lg:px-16">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground ambient-shadow md:px-16 md:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-primary-foreground/10 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -bottom-28 size-80 rounded-full bg-primary-foreground/10 blur-2xl"
            />
            <div className="relative space-y-6">
              <span className="font-sans text-xs font-semibold tracking-widest text-primary-foreground/80 uppercase">
                Inscripciones abiertas
              </span>
              <h2 className="text-4xl leading-tight tight-tracking lg:text-6xl">
                Tu futuro empieza hoy
              </h2>
              <p className="mx-auto max-w-xl text-lg text-primary-foreground/85">
                Regístrate en línea, asegura tu cupo y avanza con formación
                práctica y certificación.
              </p>
              <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary-foreground px-8 py-3.5 font-medium text-primary transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:outline-none"
                >
                  Crear cuenta
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md border border-primary-foreground/40 px-8 py-3.5 font-medium transition-colors hover:bg-primary-foreground/10 focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:outline-none"
                >
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-outline-variant bg-surface-container-low py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-16">
          <div className="mb-12 grid gap-12 md:grid-cols-11">
            <div className="space-y-4 md:col-span-4">
              <div className="flex items-center gap-2.5">
                <Image src={LogoImaf} alt="" width={28} height={28} />
                <span className="text-xl font-semibold text-on-surface">
                  IMAF
                </span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                Instituto público dedicado a la formación práctica de la mujer,
                la familia y el desarrollo laboral. Cursos presenciales,
                accesibles y con certificación oficial.
              </p>
              <div className="flex gap-2 pt-1">
                <a
                  href="https://wa.me/584121512141"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp del IMAF"
                  className="flex size-9 items-center justify-center rounded-full bg-surface-container-high text-on-surface transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <MessageCircle className="size-4" />
                </a>
                <a
                  href="https://www.instagram.com/imaf_independencia?igsh=MXBoMnJrOHJ5aHk2aw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram del IMAF"
                  className="flex size-9 items-center justify-center rounded-full bg-surface-container-high text-on-surface transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Instagram className="size-4" />
                </a>
              </div>
            </div>
            <div className="space-y-4 md:col-span-2">
              <h4 className="text-xs font-semibold tracking-widest text-on-surface uppercase">
                Estudiantes
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#cursos"
                    className="transition-colors hover:text-primary"
                  >
                    Cursos abiertos
                  </a>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="transition-colors hover:text-primary"
                  >
                    Crear cuenta
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="transition-colors hover:text-primary"
                  >
                    Iniciar sesión
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4 md:col-span-2">
              <h4 className="text-xs font-semibold tracking-widest text-on-surface uppercase">
                Recursos
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#beneficios"
                    className="transition-colors hover:text-primary"
                  >
                    Beneficios
                  </a>
                </li>
                <li>
                  <a
                    href="#como-funciona"
                    className="transition-colors hover:text-primary"
                  >
                    Cómo funciona
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="transition-colors hover:text-primary"
                  >
                    Preguntas frecuentes
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-4 md:col-span-3">
              <h4 className="text-xs font-semibold tracking-widest text-on-surface uppercase">
                Contacto
              </h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <a
                      href="https://wa.me/584121512141"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-primary"
                    >
                      +58 412-151 21 41
                    </a>
                    <p className="mt-1 text-xs">WhatsApp</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Instagram className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <a
                      href="https://www.instagram.com/imaf_independencia?igsh=MXBoMnJrOHJ5aHk2aw=="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-primary"
                    >
                      @imaf_independencia
                    </a>
                    <p className="mt-1 text-xs">Instagram</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p>{SEDE}.</p>
                    <p className="mt-1 text-xs">Dirección</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-outline-variant pt-8">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Alcaldía de Independencia. Todos los
              derechos reservados. · Instituto de la Mujer, Atención a la
              Familia y Formación para el Trabajo (IMAF)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
