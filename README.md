# Frontend IMAF - Sistema de Gestión de Cursos y Estudiantes

## Descripción del Proyecto

Este es el frontend o lado cliente del sistema de gestión de cursos y estudiantes para el **Instituto de la Mujer, Atención a la Familia y Formación para el Trabajo (IMAF)**. Este proyecto es desarrollado por un equipo de estudiantes de la **UPTYAB** como parte de un proyecto sociotecnológico.

El sistema permite gestionar de manera integral la inscripción, seguimiento y administración de cursos impartidos por el instituto, facilitando la interacción entre administradores, instructores y estudiantes.

## Roles del Sistema

El sistema cuenta con tres roles principales:

### 🔧 Administrador

- Gestión completa de cursos y usuarios
- Creación y administración de cuentas de instructores
- Creación y configuración de cursos
- Validación de comprobantes de pago de los estudiantes
- Supervisión general del sistema

### 👨‍🏫 Instructor

- Gestión de los alumnos inscritos en sus cursos
- Evaluación y seguimiento del progreso estudiantil
- Definición de aprobaciones o reprobaciones
- Administración del contenido y actividades del curso

### 👩‍🎓 Estudiante

- Registro en la plataforma
- Inscripción en cursos disponibles
- Acceso al contenido de los cursos (solo después de validar el pago)
- Seguimiento de su progreso académico

## Tecnologías Utilizadas

### Framework y Librerías Principales

- **Next.js 16.1.6** - Framework de React para aplicaciones web full-stack
- **React 19.2.3** - Librería principal para la construcción de interfaces de usuario
- **TypeScript 5** - Superset de JavaScript para tipado estático

### Estilos y UI

- **Tailwind CSS 4** - Framework de CSS para diseño rápido y personalizable
- **shadcn/ui 4.0.5** - Sistema de componentes UI reutilizables
- **Lucide React** - Biblioteca de iconos
- **Radix UI** - Componentes accesibles y sin estilo

### Formularios y Validación

- **React Hook Form 7.71.2** - Manejo de formularios con validación eficiente
- **Zod 3.22.4** - Validación de esquemas de TypeScript
- **@hookform/resolvers** - Integración entre React Hook Form y Zod

### Utilidades y Herramientas

- **Recharts 3.8.0** - Biblioteca para gráficos y visualizaciones
- **Sonner 2.0.7** - Sistema de notificaciones toast
- **nextjs-toploader 3.9.17** - Barra de progreso para navegación
- **clsx y tailwind-merge** - Utilidades para manejo de clases CSS

### Desarrollo y Calidad

- **ESLint 9** - Linter para JavaScript/TypeScript
- **Prettier 3.8.1** - Formateador de código
- **Husky 9.1.7** - Git hooks para automatización
- **lint-staged** - Ejecución de linters en archivos staged

## Instalación y Ejecución en Local

### Prerrequisitos

- Node.js (versión 18 o superior)
- npm, yarn, pnpm o bun

### Clonar el Proyecto

```bash
git clone <URL-del-repositorio>
cd frontend-imaf
```

### Instalar Dependencias

```bash
npm install
# o
yarn install
# o
pnpm install
# o
bun install
```

### Ejecutar en Modo Desarrollo

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
# o
bun dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### Comandos Adicionales

```bash
# Construir para producción
npm run build

# Iniciar servidor de producción
npm run start

# Ejecutar linter
npm run lint

# Formatear código
npm run format

# Verificar tipos
npm run type-check
```

## Estructura del Proyecto

```
├── app/                 # Páginas y layouts de Next.js
│   ├── (auth)/         # Rutas de autenticación
│   ├── admin/          # Vistas del rol administrador
│   ├── estudiante/     # Vistas del rol estudiante
│   └── instructor/       # Vistas del rol instructor
├── components/         # Componentes reutilizables
│   └── ui/            # Componentes UI base
├── hooks/             # Hooks personalizados
├── lib/               # Utilidades y configuración
└── public/            # Archivos estáticos
```

## Características Principales

- ✅ Sistema de autenticación por roles
- ✅ Gestión completa de cursos
- ✅ Procesamiento de pagos y comprobantes
- ✅ Panel de administrador intuitivo
- ✅ Interfaz moderna y responsiva
- ✅ Validación de formularios robusta
- ✅ Notificaciones en tiempo real
- ✅ Gráficos y reportes visuales
