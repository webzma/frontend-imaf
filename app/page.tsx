import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  BarChart3,
  GraduationCap,
  Award,
  Clock,
  Sparkles,
  Target,
} from "lucide-react";
import { FAQSection } from "./_components/faq-section";
import LogoImaf from "@/public/logo-imaf.webp";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation — Glassmorphism */}
      <nav className="bg-surface-container-lowest/80 glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 flex items-center justify-center">
                <Image src={LogoImaf} alt="IMAF" width={30} height={30} />
              </div>
              <span className="hidden md:flex font-serif text-2xl font-semibold text-on-surface ml-1">
                IMAF
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#beneficios"
                className="text-sm text-muted-foreground hover:text-on-surface transition-colors"
              >
                Beneficios
              </a>
              <a
                href="#como-funciona"
                className="text-sm text-muted-foreground hover:text-on-surface transition-colors"
              >
                Cómo Funciona
              </a>
              <a
                href="#faq"
                className="text-sm text-muted-foreground hover:text-on-surface transition-colors"
              >
                FAQ
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 transition-colors font-medium text-xs md:text-sm"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="bg-primary text-primary-foreground rounded-md px-5 py-2.5 ambient-shadow hover:opacity-90 transition-opacity text-xs md:text-sm font-medium"
              >
                Comenzar Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section — Student-focused */}
      <section className="relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary-container/30 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-5%] w-[400px] h-[400px] rounded-full bg-secondary-container/40 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-16 pt-8 md:pt-20 pb-28 lg:pt-28 lg:pb-36 relative">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
            {/* Left — Text content */}
            <div className="lg:col-span-7 space-y-10">
              <div className="inline-flex items-center gap-2 bg-primary-container/40 rounded-full px-4 py-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="font-sans text-xs uppercase tracking-widest text-primary font-semibold">
                  Tu Plataforma de Aprendizaje
                </span>
              </div>

              <div className="space-y-6">
                <h1 className="font-serif text-5xl sm:text-6xl lg:text-[5.5rem] tight-tracking text-on-surface leading-[1.05]">
                  Aprende
                  <br />
                  <span className="text-primary italic">a tu ritmo</span>
                </h1>
                <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-lg lg:pl-1">
                  Accede a cursos de calidad, sigue tu progreso en tiempo real y
                  obtén certificados que validen tus conocimientos. Todo en un
                  solo lugar.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 lg:pl-1">
                <Link
                  href="/register"
                  className="bg-primary text-primary-foreground rounded-md px-8 py-4 ambient-shadow hover:opacity-90 transition-all inline-flex items-center justify-center gap-2.5 font-medium"
                >
                  Empezar a Aprender
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="bg-surface-container-lowest text-on-surface rounded-md px-8 py-4 ambient-shadow hover:bg-surface-container-high transition-colors inline-flex items-center justify-center font-medium"
                >
                  Ya tengo cuenta
                </Link>
              </div>
            </div>

            {/* Right — Hero image */}
            <div className="lg:col-span-5 relative hidden lg:block pt-4">
              <div className="absolute -top-4 -left-8 w-28 h-28 rounded-full bg-primary-container/20 blur-2xl pointer-events-none" />
              <div className="relative rounded-sm overflow-hidden ambient-shadow aspect-4/5">
                <Image
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
                  alt="Estudiantes colaborando en un proyecto"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 0vw, 40vw"
                  priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-primary/20 to-transparent" />
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-6 -left-6 bg-surface-container-lowest rounded-sm p-5 ambient-shadow flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-primary-container flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-sans font-semibold text-on-surface text-lg">
                    500+
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Estudiantes activos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats — Floating bar */}
      <section className="relative -mt-14 z-10 pb-0 md:pb-8">
        <div className="max-w-5xl mx-auto px-6 lg:px-16">
          <div className="bg-surface-container-lowest rounded-sm ambient-shadow grid grid-cols-2 md:grid-cols-4 divide-x divide-outline-variant/10">
            {[
              { number: "500+", label: "Estudiantes Activos" },
              { number: "50+", label: "Cursos Disponibles" },
              { number: "1,200+", label: "Horas de Contenido" },
              { number: "95%", label: "Satisfacción" },
            ].map((stat, i) => (
              <div key={i} className="py-8 px-6 text-center">
                <div className="font-serif text-3xl lg:text-4xl tight-tracking text-primary">
                  {stat.number}
                </div>
                <div className="font-sans text-xs uppercase tracking-wider text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section — Student-focused */}
      <section id="beneficios" className="bg-surface-container-low py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          {/* Asymmetric header */}
          <div className="max-w-2xl mb-20 space-y-4">
            <span className="font-sans text-xs uppercase tracking-widest text-primary font-semibold">
              Beneficios
            </span>
            <h2 className="font-serif text-4xl lg:text-6xl tight-tracking text-on-surface leading-tight">
              Diseñado para
              <br />
              <span className="text-primary">tu éxito</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              Cada característica está pensada para que alcances tus objetivos
              de aprendizaje de forma efectiva.
            </p>
          </div>

          {/* Benefits grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Featured card */}
            <div className="lg:row-span-2 bg-surface-container-lowest rounded-sm overflow-hidden flex flex-col justify-between ambient-shadow group">
              <div className="relative h-52 lg:h-64">
                <Image
                  src="https://images.unsplash.com/photo-1513258496099-48168024aec0?w=600&q=80"
                  alt="Estudiante aprendiendo en línea"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-surface-container-lowest via-transparent to-transparent" />
              </div>
              <div className="p-10 pt-4 flex flex-col flex-1">
                <div>
                  <div className="w-14 h-14 rounded-md bg-primary flex items-center justify-center mb-6">
                    <BookOpen className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-serif text-3xl text-on-surface mb-4">
                    Aprende lo que quieras
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Accede a una biblioteca completa de cursos organizados por
                    temas. Desde fundamentos hasta temas avanzados, todo está
                    disponible para ti.
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                  <span>Ver cursos</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {[
              {
                icon: Clock,
                title: "Estudia cuando quieras",
                description:
                  "Acceso 24/7 a todo el contenido. Aprende en tus horarios, sin presiones.",
              },
              {
                icon: BarChart3,
                title: "Mide tu progreso",
                description:
                  "Visualiza tu avance con dashboards claros y métricas detalladas.",
              },
              {
                icon: Award,
                title: "Obtén certificados",
                description:
                  "Certifica tus conocimientos al completar cada curso exitosamente.",
              },
              {
                icon: Target,
                title: "Alcanza tus metas",
                description:
                  "Establece objetivos personales y recibe recomendaciones adaptadas.",
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-surface-container-lowest rounded-sm p-8 space-y-4 group hover:ambient-shadow transition-shadow"
                >
                  <div className="w-12 h-12 rounded-md bg-surface-container-high flex items-center justify-center group-hover:bg-primary-container transition-colors">
                    <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-serif text-2xl text-on-surface">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="py-8 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="text-center mb-20 space-y-4">
            <span className="font-sans text-xs uppercase tracking-widest text-primary font-semibold">
              Cómo Funciona
            </span>
            <h2 className="font-serif text-4xl lg:text-6xl tight-tracking text-on-surface">
              Tres pasos simples
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comienza tu viaje de aprendizaje en minutos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                icon: GraduationCap,
                title: "Regístrate gratis",
                description:
                  "Crea tu cuenta en segundos. Solo necesitas un correo electrónico para comenzar.",
                image:
                  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80",
                imageAlt: "Persona registrándose en su laptop",
              },
              {
                step: "02",
                icon: BookOpen,
                title: "Elige tus cursos",
                description:
                  "Explora nuestro catálogo y selecciona los cursos que te interesen. Puedes inscribirte en varios a la vez.",
                image:
                  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&q=80",
                imageAlt: "Estudiante explorando cursos",
              },
              {
                step: "03",
                icon: Award,
                title: "Aprende y certifícate",
                description:
                  "Completa las lecciones a tu ritmo, realiza las evaluaciones y obtén tu certificado.",
                image:
                  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&q=80",
                imageAlt: "Estudiantes celebrando su graduación",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="relative">
                  <div className="bg-surface-container-low rounded-sm overflow-hidden hover:ambient-shadow transition-shadow">
                    <div className="relative h-40">
                      <Image
                        src={item.image}
                        alt={item.imageAlt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-surface-container-low to-transparent" />
                      <span className="absolute top-4 right-4 font-serif text-5xl text-white/30 font-bold">
                        {item.step}
                      </span>
                    </div>
                    <div className="p-10 pt-4 space-y-6">
                      <div className="w-14 h-14 rounded-md bg-primary flex items-center justify-center">
                        <Icon className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-serif text-2xl text-on-surface">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-6 lg:-right-10 w-12 lg:w-20 h-px bg-outline-variant/30" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-surface-container-low py-8 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
            {/* Left — sticky heading */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-28 lg:self-start">
              <span className="font-sans text-xs uppercase tracking-widest text-primary font-semibold">
                FAQ
              </span>
              <h2 className="font-serif text-4xl lg:text-5xl tight-tracking text-on-surface leading-tight">
                Preguntas
                <br />
                frecuentes
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                ¿Tienes dudas? Aquí respondemos las más comunes.
              </p>
            </div>
            {/* Right — accordion */}
            <div className="lg:col-span-8">
              <FAQSection />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-8 md:py-28">
        <div className="absolute inset-0 bg-primary/4" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary-container/10 blur-[150px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 lg:px-16 text-center space-y-8 relative">
          <div className="inline-flex items-center gap-2 bg-primary-container/40 rounded-full px-4 py-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="font-sans text-xs uppercase tracking-widest text-primary font-semibold">
              Comienza Hoy
            </span>
          </div>
          <h2 className="font-serif text-4xl lg:text-7xl tight-tracking text-on-surface leading-tight">
            Tu futuro
            <br />
            <span className="text-primary italic">empieza ahora</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Únete a cientos de estudiantes que ya están transformando su
            aprendizaje con IMAF.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/register"
              className="bg-primary text-primary-foreground rounded-md px-10 py-4 ambient-shadow hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2.5 font-medium text-lg"
            >
              Crear Cuenta Gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="bg-surface-container-lowest text-on-surface rounded-md px-10 py-4 ambient-shadow hover:bg-surface-container-high transition-colors inline-flex items-center justify-center font-medium text-lg"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-highest py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="grid md:grid-cols-12 gap-12 mb-12">
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Image src={LogoImaf} alt="IMAF" width={24} height={24} />
                </div>
                <span className="font-serif text-xl font-semibold text-on-surface">
                  IMAF
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Tu plataforma de aprendizaje en línea. Aprende a tu ritmo,
                certifica tus conocimientos.
              </p>
            </div>
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-sans text-xs uppercase tracking-widest font-semibold text-on-surface">
                Estudiantes
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/register"
                    className="hover:text-primary transition-colors"
                  >
                    Registrarse
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-primary transition-colors"
                  >
                    Iniciar Sesión
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
              <h4 className="font-sans text-xs uppercase tracking-widest font-semibold text-on-surface">
                Recursos
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#como-funciona"
                    className="hover:text-primary transition-colors"
                  >
                    Cómo Funciona
                  </Link>
                </li>
                <li>
                  <Link
                    href="#faq"
                    className="hover:text-primary transition-colors"
                  >
                    Preguntas Frecuentes
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Soporte
                  </Link>
                </li>
              </ul>
            </div>
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-sans text-xs uppercase tracking-widest font-semibold text-on-surface">
                Legal
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Términos
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="bg-surface-container-high/50 h-px w-full" />
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} IMAF. Todos los derechos reservados.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Hecho con dedicación para estudiantes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
