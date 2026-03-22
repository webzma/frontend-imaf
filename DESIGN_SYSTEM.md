# Design System: Editorial Rose

## Creative North Star: "The Modern Muse"

Este sistema de diseño rechaza la naturaleza "encajonada" de las grillas web tradicionales en favor de una experiencia editorial de alta gama. Está diseñado para sentirse como una monografía digital premium—respirando con espacios en blanco intencionales, profundidad tonal rica y una paleta sofisticada de rosa empolvado y cremas cálidos.

Logramos un aspecto "característico" al romper la plantilla a través de **Asimetría Intencional**. Los elementos rara vez deben estar perfectamente centrados; en su lugar, usa la escala de espaciado para crear diseños desplazados donde las imágenes y la tipografía se superponen, creando una sensación de capas físicas y movimiento curado.

---

## Paleta de Colores

### Lógica Tonal

La paleta es una transición de tonos pesados de terracota a un espectro refinado de cuarzo rosa empolvado y crema cálido.

#### Primary (Principal)
- **HEX**: `#7d5050`
- **OKLCH**: `oklch(0.48 0.05 15)`
- **Uso**: Rosa sofisticado y apagado. Úsalo para momentos clave de marca y llamadas a la acción.

#### Primary Container
- **OKLCH**: `oklch(0.55 0.06 15)`
- **Uso**: Variante para gradientes y estados hover

#### Surface & Background
- **HEX**: `#fcf9f4`
- **OKLCH**: `oklch(0.98 0.008 35)`
- **Uso**: Crema cálido y lechoso que proporciona una sensación más suave y "costosa" que el blanco puro.

#### Secondary
- **HEX**: `#685b5b`
- **OKLCH**: `oklch(0.42 0.02 15)`
- **Uso**: Ancla "empolvada" que asegura que el sistema se sienta fundamentado y maduro.

#### Secondary Container
- **HEX**: `#f0dede`
- **OKLCH**: `oklch(0.90 0.02 15)`
- **Uso**: Fondos secundarios, elementos de soporte

#### Tertiary
- **HEX**: `#785253`
- **OKLCH**: `oklch(0.50 0.04 15)`
- **Uso**: Proporciona el ancla "empolvada" adicional

#### On Surface (Texto)
- **HEX**: `#1c1c19`
- **OKLCH**: `oklch(0.15 0.005 35)`
- **Uso**: **Nunca uses negro puro**. Usa este color para todo el texto para mantener la atmósfera "rosa empolvado" cohesiva.

### Sistema de Superficies

El sistema utiliza capas tonales para crear profundidad:

- **surface-container-lowest**: `oklch(1 0 0)` - Blanco puro para elementos flotantes
- **surface-container-low**: `oklch(0.97 0.007 35)` - Para secciones
- **surface**: `oklch(0.98 0.008 35)` - Base principal
- **surface-container**: `oklch(0.96 0.006 35)` - Contenedores estándar
- **surface-container-high**: `oklch(0.95 0.006 35)` - Elementos elevados
- **surface-container-highest**: `oklch(0.94 0.006 35)` - Máxima elevación

### Regla "Sin Líneas"

**Instrucción Explícita:** Los bordes sólidos de 1px están estrictamente prohibidos para seccionar. Para definir límites entre áreas de contenido, usa cambios de color de fondo. Una sección que use `surface-container-low` debe estar directamente contra un fondo `surface`. La transición de tono es el divisor.

### Regla "Vidrio y Gradiente"

Para agregar "alma" a la UI, los CTAs principales y fondos Hero deben utilizar gradientes lineales sutiles moviéndose de `primary` a `primary-container`. Para overlays flotantes (menús, modales), usa **Glassmorphism**: aplica un `surface-container` semi-transparente con un `blur` de `20px` para permitir que los tonos rosa y crema se filtren.

---

## Tipografía

La voz tipográfica es un diálogo entre la elegancia dramática de **Cormorant Garamond** y la eficiencia limpia y moderna de **Manrope**.

### Fuentes

- **Display & Headline**: **Cormorant Garamond** - "Anclas Editoriales"
- **Body & Labels**: **Manrope** - "Caballo de Batalla"

### Jerarquía

- **Display Large**: `3.5rem` (56px) para momentos hero
- **Headlines**: Fomenta `letter-spacing: -0.02em` en encabezados grandes para crear una sensación densa y premium
- **Body Text**: Debe permanecer estrictamente alineado a un ritmo de espaciado de `1.4rem` o `1.7rem` para asegurar legibilidad

### Objetivo de Jerarquía

Los encabezados grandes y expresivos deben superponerse frecuentemente a contenedores de fondo o imágenes, mientras que el texto del cuerpo permanece estrictamente alineado.

### Uso en Código

```tsx
// Headline editorial
<h1 className="font-serif text-6xl tight-tracking">Título Principal</h1>

// Body text
<p className="font-sans text-base text-on-surface">Contenido del cuerpo</p>

// Label
<span className="font-sans text-sm uppercase">Etiqueta</span>
```

---

## Elevación y Profundidad

En este sistema, la profundidad es biológica y tonal, no mecánica.

### Principio de Capas

La profundidad se logra "apilando" niveles de superficie:

1. **Base**: `surface` (#fcf9f4)
2. **Secciones**: `surface-container-low` (#f6f3ee)
3. **Elementos Flotantes**: `surface-container-lowest` (#ffffff)

### Sombras Ambientales (Ambient Bloom)

**Evita las "drop shadows" estándar.** Cuando un elemento debe flotar (ej. botón primario o modal), usa un **Ambient Bloom**:

- **Y-Offset**: 12px
- **Blur**: 32px
- **Color**: `on-surface` (#1c1c19) al 5% de opacidad

Esto imita la luz natural golpeando papel fino en lugar de un "brillo" digital.

```tsx
<div className="ambient-shadow bg-surface-container-lowest rounded-md p-6">
  Contenido flotante
</div>
```

### Borde "Fantasma" de Respaldo

Si se requiere un borde para accesibilidad, usa el token `outline-variant` al **15% de opacidad**. Nunca uses líneas opacas al 100%.

```tsx
<div className="border border-outline-variant">Contenido</div>
```

---

## Componentes

### Botones

#### Primary Button
```tsx
<button className="bg-primary text-primary-foreground rounded-md px-6 py-3 ambient-shadow">
  Acción Principal
</button>
```
- Fondo: `bg-primary` (#7d5050)
- Texto: `text-primary-foreground` (blanco)
- Forma: `rounded-md` (0.375rem)
- Sombra: `ambient-shadow`

#### Secondary Button
```tsx
<button className="bg-secondary-container text-on-secondary-container rounded-md px-6 py-3">
  Acción Secundaria
</button>
```
- Fondo: `bg-secondary-container` (#f0dede)
- Sin borde

#### Tertiary Button (Solo Texto)
```tsx
<button className="text-primary underline-offset-4 hover:underline">
  Acción Terciaria
</button>
```
- Solo texto usando color `primary`
- Subrayado sutil que aparece solo en hover

### Input Fields

**Estilo**: Abandona el aspecto de "caja". Usa un fondo `surface-variant` con un borde redondeado `sm` (0.125rem) en el borde inferior.

```tsx
<input 
  className="bg-surface-variant rounded-b-sm px-4 py-3 w-full focus:bg-surface-container-high focus:text-primary outline-none transition-colors"
  placeholder="Texto de ejemplo"
/>
```

**Estado Activo**: Transición del fondo a `surface-container-high` y cambio del color de la etiqueta a `primary`.

### Cards

**Construcción**: Absolutamente sin bordes. Usa `surface-container-low` para el cuerpo de la tarjeta.

```tsx
<div className="bg-surface-container-low rounded-sm p-8">
  <img src="..." className="rounded-sm mb-4" />
  <h3 className="font-serif text-2xl mb-2">Título de Card</h3>
  <p className="text-muted-foreground">Descripción</p>
</div>
```

- **Padding**: Usa un mínimo de `2rem` (32px) para que el contenido "respire"
- **Imágenes**: Las imágenes dentro de las tarjetas deben tener un radio `sm` para sentirse integradas pero nítidas

### Modales y Overlays (Glassmorphism)

```tsx
<div className="glass bg-surface-container/80 rounded-lg p-8 ambient-shadow">
  <h2 className="font-serif text-3xl mb-4">Modal Title</h2>
  <p>Contenido del modal</p>
</div>
```

### Listas Editoriales

**Reglas**: Prohíbe el uso de líneas divisorias. Separa elementos usando `0.85rem` de espacio en blanco vertical.

```tsx
<ul className="space-y-3.5">
  <li>
    <span className="font-sans text-sm text-muted-foreground uppercase">Metadata</span>
    <h4 className="font-sans text-lg font-medium">Nombre del Item</h4>
  </li>
</ul>
```

---

## Espaciado Asimétrico

### Uso de Espaciado Asimétrico

Alinea un encabezado a la izquierda, pero desplaza el texto del cuerpo a la derecha usando tokens de espaciado grandes.

```tsx
<section className="editorial-spacing-asymmetric py-16">
  <h2 className="font-serif text-5xl tight-tracking mb-8">Título</h2>
  <p className="text-base">Contenido del cuerpo...</p>
</section>
```

---

## Do's and Don'ts

### ✅ Do:

- **Usa Espaciado Asimétrico**: Alinea un encabezado a la izquierda, pero desplaza el texto del cuerpo a la derecha usando el token de espaciado `16` (5.5rem)
- **Abraza las Capas Tonales**: Coloca elementos `surface-container-highest` dentro de secciones `surface-container-low` para crear puntos focales
- **Mezcla Pesos**: Empareja un `display-lg` (Serif) con un `label-sm` (Sans-serif) en mayúsculas para un ambiente editorial de alta moda
- **Usa Gradientes**: Aplica `gradient-primary` a CTAs y heros para agregar profundidad
- **Usa Glassmorphism**: Aplica la clase `glass` a overlays flotantes

### ❌ Don't:

- **No uses líneas de 1px**: Las líneas se sienten como un diseño "bootstrap" predeterminado. Definimos espacio a través de color y padding
- **No uses negro puro**: Usa `on-surface` (#1c1c19) para todo el texto para mantener la atmósfera "rosa empolvado" cohesiva
- **No llenes los bordes**: Si un componente se siente "pegado" al lado de la pantalla, aumenta el margen usando los tokens de espaciado `10` (3.5rem) o `12` (4rem)
- **No centres todo**: La asimetría es clave para el aspecto editorial

---

## Clases de Utilidad Personalizadas

### Sombras
- `ambient-shadow`: Sombra ambient bloom (12px offset, 32px blur, 5% opacity)

### Efectos
- `glass`: Glassmorphism con backdrop-blur de 20px
- `gradient-primary`: Gradiente lineal de primary a primary-container

### Espaciado
- `editorial-spacing-asymmetric`: Padding asimétrico (1.4rem izq, 5.5rem der)

### Tipografía
- `tight-tracking`: Letter-spacing de -0.02em para headlines grandes

---

## Modo Oscuro

El sistema incluye soporte completo para modo oscuro con variantes automáticas de todos los colores, manteniendo la misma paleta base pero con valores de luminosidad ajustados para mantener la atmósfera editorial.

```tsx
// El modo oscuro se activa automáticamente con la clase .dark en el html
<html className="dark">
```
