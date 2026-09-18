# Design System — IMAF

> **Fuente de verdad: [`app/globals.css`](app/globals.css).** Este documento
> describe lo que hay en el código. Si los dos discrepan, gana `globals.css` y
> este archivo está desactualizado.

Plataforma del Instituto de la Mujer, Atención a la Familia y Formación para el
Trabajo (Municipio Independencia, Yaracuy). Es una web institucional pública
más un panel de gestión: el sistema prioriza **legibilidad y accesibilidad**
sobre efectismo. Buena parte del público entra desde teléfonos de gama baja y
con conexiones lentas.

---

## Principios

1. **Todo color pasa por un token.** Nunca `bg-emerald-500` ni un hex suelto en
   un componente. Si falta un color, se añade al token block de `globals.css`.
2. **Contraste verificado, no estimado.** Todo par texto/fondo del sistema
   cumple WCAG AA (≥4.5:1 en texto normal, ≥3:1 en bordes de foco).
3. **El color nunca es el único canal.** Todo estado lleva además un icono o
   una etiqueta.
4. **Sin opacidad sobre texto.** `text-*/40` produce contrastes imposibles de
   auditar. Se usan tokens sólidos.

---

## Color

### Superficies

Escala **estrictamente monótona**: subir un nivel siempre oscurece (y en modo
oscuro, siempre aclara). Ese es el único mecanismo de profundidad del sistema.

| Token                       | Claro     | Oscuro    | Uso                                    |
| --------------------------- | --------- | --------- | -------------------------------------- |
| `surface-container-lowest`  | `#ffffff` | `#0e0e0e` | Tarjetas elevadas, elementos flotantes |
| `surface`                   | `#faf8f7` | `#131313` | Fondo de página                        |
| `surface-container-low`     | `#f3f0ef` | `#1c1b1b` | Secciones alternas, paneles            |
| `surface-container`         | `#ece8e7` | `#232222` | Hover de tarjetas y filas              |
| `surface-container-high`    | `#e4dfde` | `#2c2b2b` | Elementos elevados                     |
| `surface-container-highest` | `#dcd6d4` | `#363434` | Máxima elevación (sin texto encima)    |

### Marca

| Token                  | Claro     | Oscuro    | Notas                                                    |
| ---------------------- | --------- | --------- | -------------------------------------------------------- |
| `primary`              | `#b52569` | `#ffb1c5` | 5.78:1 como texto sobre crema · 6.12:1 con blanco encima |
| `primary-hover`        | `#a51f5f` | `#ffc9d7` | El hover **oscurece**; aclarar rompía AA                 |
| `primary-container`    | `#fbdde8` | `#7a0f43` | Fondos suaves de marca                                   |
| `on-primary-container` | `#7a0f43` | `#ffd9e2` | Texto sobre `primary-container`                          |

### Texto

| Token              | Claro     | Oscuro    | Uso                                                      |
| ------------------ | --------- | --------- | -------------------------------------------------------- |
| `on-surface`       | `#1a1817` | `#e5e2e1` | Texto principal. Nunca negro puro                        |
| `muted-foreground` | `#5f5b59` | `#a8a29e` | Texto secundario. Pasa AA sobre **las seis** superficies |

### Estados semánticos

Cuatro significados, no nueve tonos sueltos. Cada uno con su `container` y su
`on-container`.

| Familia   | `--x` claro | `--x` oscuro | Significado                     |
| --------- | ----------- | ------------ | ------------------------------- |
| `success` | `#1a7a4c`   | `#6fd39b`    | Activo, aprobado, realizada     |
| `warning` | `#8a5a00`   | `#e8b761`    | Pendiente                       |
| `danger`  | `#c02626`   | `#ff8f8f`    | Rechazado, cancelada, reprobado |
| `info`    | `#1f5fa8`   | `#7db4f0`    | Programada                      |

`destructive` es independiente de `primary` en ambos modos — en oscuro eran el
mismo rosa y el botón de eliminar se confundía con el de guardar.

### Gráficas

`chart-1…5` son cinco **matices distintos en orden fijo**: magenta, azul,
naranja, verde, morado. Los valores salen de un validador de paletas, no del
ojo, y cumplen cinco comprobaciones en ambos modos: banda de luminosidad, suelo
de croma, separación bajo daltonismo entre pares contiguos (ΔE ≥ 8 en OKLab
×100), suelo de visión normal y contraste ≥ 3:1 sobre la superficie.

Tres reglas que se derivan de ahí:

1. **El orden no se cicla ni se reordena.** Una serie conserva su tono aunque un
   filtro cambie cuántas series hay. El verde va detrás del naranja porque
   contiguos se confundían bajo deuteranopia.
2. **Como mucho tres series a la vez.** Los tres primeros tonos son seguros
   comparando cualquier par entre sí; a partir de la cuarta serie hay pares que
   no separan, así que se divide en varias gráficas en vez de añadir colores.
3. **El modo oscuro tiene sus propios pasos, no el reflejo de los claros.** Los
   pastel que había antes (`#ffb1c5`, `#6fd39b`…) quedaban fuera de la banda de
   luminosidad del modo oscuro y el rosa caía bajo el suelo de croma: se leía
   casi gris.

| Uso                         | Forma                                           |
| --------------------------- | ----------------------------------------------- |
| Comparar magnitudes         | barra (horizontal si los nombres son largos)    |
| Parte de un todo, ≤3 clases | barra apilada horizontal con leyenda y cifras   |
| Dos clases                  | no es una gráfica: es un número con su contexto |
| Más de ~7 clases            | una tabla                                       |

Nunca una tarta con el porcentaje escrito en blanco encima: obliga a comparar
ángulos y el texto no tiene contraste garantizado sobre un color de serie.

---

## Tipografía

Dos familias, ambas por `next/font` (sin `@import` a CDNs externos).

- **Display — Cormorant Garamond** (`font-serif`): titulares, `h1`–`h6`.
  Aplicada por defecto a todos los encabezados desde `@layer base`.
- **Texto — Manrope** (`font-sans`): cuerpo, etiquetas, UI. Es la fuente por
  defecto de `<html>`.

**Sin itálicas en encabezados.** El énfasis dentro de un titular se carga con
color (`text-primary`) o peso, nunca con `italic`.

```tsx
<h1 className="text-5xl tight-tracking">
  Inscríbete en línea.{" "}
  <span className="text-primary">Aprende presencialmente.</span>
</h1>
```

---

## Forma

Una sola escala de radios, derivada de `--radius: 0.625rem`:

| Clase        | Valor | Uso                                |
| ------------ | ----- | ---------------------------------- |
| `rounded-sm` | 4px   | Inputs, badges, elementos pequeños |
| `rounded-md` | 8px   | Botones                            |
| `rounded-lg` | 10px  | Tarjetas, paneles                  |
| `rounded-xl` | 14px  | Contenedores grandes               |

---

## Elevación

`ambient-shadow` — sombra neutra y suave (no un halo rosa):

```css
box-shadow:
  0 12px 32px rgba(26, 24, 23, 0.06),
  0 2px 8px rgba(26, 24, 23, 0.04);
```

La profundidad se construye **apilando niveles de superficie**; la sombra solo
despega el elemento del plano.

---

## Componentes

### Botones ([`components/ui/button.tsx`](components/ui/button.tsx))

`default` (primario) · `outline` · `secondary` · `ghost` · `destructive` · `link`.

Una sola acción primaria por bloque. Tres botones primarios juntos no son una
jerarquía.

### Inputs ([`components/ui/input.tsx`](components/ui/input.tsx))

Fondo `surface-variant` con borde inferior de 2px. Al foco: el fondo pasa a
blanco y el borde inferior a `primary` (5.39:1 contra el campo), más un anillo.
Estado inválido vía `aria-invalid`.

### Badges de estado ([`components/ui/badge.tsx`](components/ui/badge.tsx))

Cada variante de estado mapea a una familia semántica **y trae su propio
icono**, inyectado automáticamente. Dos estados que comparten color se
distinguen por el icono (WCAG 1.4.1).

```tsx
<Badge variant="pendiente">Pendiente</Badge>   {/* warning + reloj */}
<Badge variant="aprobado">Aprobado</Badge>     {/* success + check */}
```

### Tablas ([`components/data-table.tsx`](components/data-table.tsx))

Una lista del panel **no se escribe a mano**. `<DataTable>` recibe una sola
definición de columnas y genera con ella la tabla de escritorio, las tarjetas de
móvil, el esqueleto de carga, el estado vacío, la ordenación y la paginación.
Escribir las dos formas por separado era lo que hacía que divergieran en qué
campos mostraba cada una.

```tsx
const columnas: Column<Estudiante>[] = [
  { id: "nombre", header: "Estudiante", sortKey: "nombre", primary: true,
    mobileLabel: null, cell: (e) => <Identidad estudiante={e} /> },
  { id: "estado", header: "Estado", aside: true, cell: (e) => <Badge … /> },
];
```

- `primary` — identidad de la fila; encabeza la tarjeta en móvil.
- `aside` — se ancla a la derecha de esa cabecera (estados, badges).
- `mobileLabel: null` — la columna no se repite como par dato/valor.
- `sortKey` — clave que entiende el backend; sin ella la columna no ordena.

Por debajo de `md` sigue habiendo `.table-scroll` + `.table-sticky-first` para
las tablas que se pintan fuera del componente.

### Listas de recursos ([`hooks/use-resource-list.ts`](hooks/use-resource-list.ts))

Buscar, filtrar, ordenar y paginar **los resuelve el servidor**, y el estado
vive en la URL. Filtrar en memoria sobre la página cargada significaba que
buscar a alguien de la página 4 devolvía "sin resultados", y guardarlo en
`useState` significaba que recargar o compartir el enlace perdía el contexto.

```tsx
const lista = useResourceList<Estudiante>({
  resource: "estudiantes",
  path: "api/admin/estudiantes",
  defaultFilters: { estado: TODOS, curso_id: TODOS },
  defaultSort: { column: "nombre", direction: "asc" },
});
```

Un filtro en `TODOS` no viaja como parámetro; cambiar cualquier filtro vuelve a
la página 1; la búsqueda lleva retardo para no consultar por pulsación.

### Formularios largos ([`components/form-panel.tsx`](components/form-panel.tsx))

Más de seis campos van en `<FormPanel>`, un panel lateral con el pie fijo, no en
un modal centrado con `overflow-y-auto`: ahí el botón de guardar se iba con el
scroll y un error de validación arriba quedaba fuera de la vista. Los campos se
envuelven en `<Field>`, que genera el `id`, asocia la etiqueta y engancha el
mensaje de error con `aria-describedby`.

### Confirmaciones ([`components/confirm-dialog.tsx`](components/confirm-dialog.tsx))

Toda acción sin vuelta atrás pasa por `<ConfirmDialog>`, que es un `AlertDialog`
de Radix: obliga a un botón de cancelar, devuelve el foco a él al abrir y no se
cierra al pulsar fuera. **Nunca `confirm()` del navegador** y **nunca un diálogo
dentro de otro**: dos trampas de foco apiladas dejan el foco suelto al cerrar la
interior.

---

## Accesibilidad — mínimos no negociables

- **Foco visible siempre**: `focus-visible:ring-2 focus-visible:ring-ring
focus-visible:ring-offset-2`. El anillo es opaco; nunca `ring-ring/40`.
- **Formularios**: `autoComplete` en todo campo de identidad o credencial.
- **Errores**: nunca un `<div>` de color. `<Alert>` para un error de formulario
  y `<ErrorState>` para un fallo de carga; los dos llevan su `role` dentro, así
  que un error nuevo nace anunciándose y el de carga trae su botón de reintentar.
- **Cambios silenciosos**: el conteo de resultados de una lista va en
  `aria-live="polite"`. Al filtrar, "24 encontrados" cambiaba sin decir nada.
- **Tablas**: `<th scope="col">` y un `<caption>` (puede ir en `sr-only`). Sin
  ellos la tabla se lee como una lista plana de valores sueltos.
- **Nada pulsable que no sea un control**: un `<div onClick>` no se alcanza con
  teclado ni se anuncia. Tarjeta que abre algo → `<button>` o `<Link>`.
- **Iconos sin texto**: `aria-label`. Textos `sr-only` en español.
- **Movimiento**: `globals.css` anula transformaciones y acorta transiciones
  bajo `prefers-reduced-motion: reduce`.

---

## Qué no hacer

- ❌ Colores crudos de Tailwind (`bg-emerald-500`, `text-rose-700`). Usa tokens.
- ❌ Opacidad sobre texto (`text-on-surface/40`).
- ❌ Itálicas en encabezados.
- ❌ Blobs decorativos con `blur-[120px]`. Costaban composición en gama baja y
  no aportaban jerarquía.
- ❌ Métricas inventadas. Si no hay dato confirmado, no se publica número.
- ❌ Fotos de stock genéricas. Mejor tipografía que una imagen que no es del
  instituto.
- ❌ `transition-all` — anima propiedades de layout. Enumera las propiedades.
- ❌ Contar `data.length` de una respuesta paginada. Son diez registros, no el
  total: para eso están los endpoints `…/resumen` y `/api/admin/dashboard`.
- ❌ Pedir un catálogo para un `<Select>` sin `per_page`. Usa `fetchAll`, o el
  desplegable se queda en diez opciones.
- ❌ Copiar `getCookie` o `getAuthHeaders` en una pantalla. Todo pasa por
  [`lib/api-client.ts`](lib/api-client.ts), que además cierra la sesión en un 401
  en vez de dejar la vista vacía.
- ❌ Tartas con el porcentaje en blanco encima, y cualquier color de gráfica
  escrito a mano (`oklch(...)`) fuera de los tokens `chart-*`.
