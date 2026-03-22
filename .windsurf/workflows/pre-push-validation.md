---
description: Workflow de validación automática antes de hacer push
---

# Pre-Push Validation Workflow

Este workflow se ejecuta automáticamente cada vez que intentas hacer `git push` y valida que el código cumpla con los estándares de calidad del proyecto.

## ¿Qué se valida?

El hook de pre-push ejecuta las siguientes validaciones en orden:

1. **Formateo de código** (`format:check`)
   - Verifica que todo el código esté formateado correctamente con Prettier
   - Si falla, ejecuta `pnpm run format` para corregir automáticamente

2. **Linting** (`lint`)
   - Ejecuta ESLint para verificar errores de código y estilo
   - Debe corregirse manualmente antes de hacer push

3. **Type checking** (`type-check`)
   - Verifica que no haya errores de TypeScript
   - Debe corregirse manualmente antes de hacer push

4. **Build** (`build`)
   - Compila el proyecto completo para asegurar que no hay errores de compilación
   - Debe corregirse manualmente antes de hacer push

## Comandos disponibles

```bash
# Formatear todo el código automáticamente
pnpm run format

# Verificar formateo sin modificar archivos
pnpm run format:check

# Ejecutar linter
pnpm run lint

# Verificar tipos de TypeScript
pnpm run type-check

# Compilar el proyecto
pnpm run build
```

## ¿Qué hacer si falla el pre-push?

### Si falla el formateo:

```bash
pnpm run format
git add .
git commit -m "fix: format code"
git push
```

### Si falla el linting:

1. Revisa los errores mostrados en la terminal
2. Corrige los errores manualmente
3. Ejecuta `pnpm run lint` para verificar
4. Haz commit de los cambios y vuelve a hacer push

### Si falla el type-check:

1. Revisa los errores de TypeScript mostrados
2. Corrige los errores de tipos
3. Ejecuta `pnpm run type-check` para verificar
4. Haz commit de los cambios y vuelve a hacer push

### Si falla el build:

1. Revisa los errores de compilación
2. Corrige los errores
3. Ejecuta `pnpm run build` para verificar
4. Haz commit de los cambios y vuelve a hacer push

## Saltar las validaciones (NO RECOMENDADO)

En casos excepcionales, puedes saltar las validaciones usando:

```bash
git push --no-verify
```

⚠️ **Advertencia**: Solo usa esto en casos de emergencia. El código sin validar puede romper el proyecto.

## Configuración

- **Hook location**: `.husky/pre-push`
- **Scripts**: Definidos en `package.json`
- **Husky config**: Inicializado automáticamente con `pnpm install`

## Troubleshooting

### El hook no se ejecuta

```bash
# Reinstalar Husky
pnpm run prepare

# Verificar permisos
chmod +x .husky/pre-push
```

### Errores de permisos

```bash
chmod +x .husky/pre-push
```

### Desactivar temporalmente

Renombra el archivo `.husky/pre-push` a `.husky/pre-push.disabled`
