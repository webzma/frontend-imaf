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
  Search,
  CreditCard,
  Phone,
  MapPin,
  Instagram,
} from "lucide-react";
import { FAQSection } from "./_components/faq-section";
import LogoImaf from "@/public/logo-imaf.webp";
import imgHero from "@/public/image-hero.webp";

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
                  Tu Puerta a la Formación IMAF
                </span>
              </div>

              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] tight-tracking text-on-surface leading-[1.05]">
                  Inscríbete en línea.
                  <br />
                  <span className="text-primary italic">
                    Aprende presencialmente.
                  </span>
                </h1>
                <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-lg lg:pl-1">
                  Reserva y paga tu curso en esta web. Asiste a nuestras clases
                  en la institución, aprende con metodología práctica y recibe
                  tu certificado. Cursos gratuitos y con costo para mujeres,
                  familias y todos quienes buscan crecer.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 lg:pl-1">
                <Link
                  href="/register"
                  className="bg-primary text-primary-foreground rounded-md px-8 py-4 ambient-shadow hover:opacity-90 transition-all inline-flex items-center justify-center gap-2.5 font-medium"
                >
                  Inscríbete ahora
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="bg-surface-container-lowest text-on-surface rounded-md px-8 py-4 ambient-shadow hover:bg-surface-container-high transition-colors inline-flex items-center justify-center font-medium"
                >
                  Iniciar sesión
                </Link>
              </div>
            </div>

            {/* Right — Hero image */}
            <div className="lg:col-span-5 relative hidden lg:block pt-4">
              <div className="absolute -top-4 -left-8 w-28 h-28 rounded-full bg-primary-container/20 blur-2xl pointer-events-none" />
              <div className="relative rounded-sm overflow-hidden ambient-shadow aspect-4/5">
                <Image
                  src={imgHero}
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
                    Egresados certificados
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
              { number: "+X", label: "Personas inscritas este año" },
              { number: "+X", label: "Cursos Presenciales" },
              { number: "+X", label: "Horas de formación práctica" },
              { number: "100%", label: "Certificación" },
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
            <h2 className="text-4xl lg:text-6xl tight-tracking text-on-surface leading-tight">
              Beneficios de formarte en
              <br />
              <span className="text-primary">IMAF</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              Gestiona todo en línea y vive una experiencia presencial de
              calidad. Cada paso está pensado para que accedas a formación real,
              certificados válidos y oportunidades concretas.
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
                  <h3 className="text-3xl text-on-surface mb-4">
                    Amplia oferta formativa
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Cursos prácticos en oficios, emprendimiento y desarrollo
                    personal. Elige la formación que se ajuste a tus metas y a
                    tu realidad.
                  </p>
                </div>
              </div>
            </div>

            {[
              {
                icon: Clock,
                title: "Inscripción rápida y sin filas",
                description:
                  "Acceso 24/7 a todo el contenido. Aprende en tus horarios, sin presiones.",
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

      {/* How It Works Section */}
      <section id="como-funciona" className="py-8 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="text-center mb-20 space-y-4">
            <span className="font-sans text-xs uppercase tracking-widest text-primary font-semibold">
              Cómo Funciona
            </span>
            <h2 className="text-4xl lg:text-6xl tight-tracking text-on-surface">
              Tres pasos simples
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Gestiona todo en línea y asiste presencialmente a nuestra sede.
              Sin complicaciones, sin filas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                icon: Search,
                title: "Elige tu curso",
                description:
                  "Explora la oferta formativa IMAF: cursos gratuitos para comunidades y cursos con costo.",
                image:
                  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80",
                imageAlt: "Persona registrándose en su laptop",
              },
              {
                step: "02",
                icon: CreditCard,
                title: "Inscríbete y paga a tu ritmo",
                description:
                  "Completa tu registro en línea. Paga el total o fracciona tu inscripción en cuotas. Recibe confirmación inmediata con los detalles de tu cupo.",
                image:
                  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&q=80",
                imageAlt: "Estudiante explorando cursos",
              },
              {
                step: "03",
                icon: Award,
                title: "Asiste, aprende y certifícate",
                description:
                  "Acude a nuestra sede en los horarios asignados. Vive una experiencia presencial práctica, y obtén tu certificado.",
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
                        <h3 className="text-2xl text-on-surface">
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
              <h2 className="text-4xl lg:text-5xl tight-tracking text-on-surface leading-tight">
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

      {/* Mission & Vision Section */}
      <section className="bg-surface py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-container/40 rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="font-sans text-xs uppercase tracking-widest text-primary font-semibold">
                Nuestro compromiso institucional
              </span>
            </div>
            <h2 className="text-4xl lg:text-6xl tight-tracking text-on-surface leading-tight mb-6">
              Formación, derechos y oportunidades
              <br />
              <span className="text-primary italic">
                reales para el Municipio Independencia
              </span>
            </h2>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Mission Card */}
            <div className="bg-surface-container-low rounded-sm p-8 lg:p-10 ambient-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
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

            {/* Vision Card */}
            <div className="bg-surface-container-low rounded-sm p-8 lg:p-10 ambient-shadow">
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

      {/* Final CTA */}
      <section className="relative overflow-hidden py-8 md:py-28">
        <div className="absolute inset-0 bg-primary/4" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary-container/10 blur-[150px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 lg:px-16 text-center space-y-8 relative">
          <div className="inline-flex items-center gap-2 bg-primary-container/40 rounded-full px-4 py-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="font-sans text-xs uppercase tracking-widest text-primary font-semibold">
              Inscripciones Abiertas
            </span>
          </div>
          <h2 className="text-4xl lg:text-7xl tight-tracking text-on-surface leading-tight">
            Tu futuro
            <br />
            <span className="text-primary italic">empieza hoy</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Únete a cientos de mujeres y hombres que ya están construyendo su
            trayectoria con IMAF. Regístrate en línea, asegura tu cupo
            presencial y avanza con formación práctica y certificación.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/register"
              className="bg-primary text-primary-foreground rounded-md px-10 py-4 ambient-shadow hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2.5 font-medium text-lg"
            >
              Crear mi cuenta
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
              <h4 className="text-xs uppercase tracking-widest font-semibold text-on-surface">
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
                    <p className="text-xs text-muted-foreground/70 mt-1">
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
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Instagram
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-on-surface">
                      5ta av. entre calles 29 y 30.
                      <br />
                      Antigua sede de la Unidad de Diálisis.
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Dirección
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-high/50 h-px w-full" />
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
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
