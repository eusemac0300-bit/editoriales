# Manual del Desarrollador - Editorial Pro (SaaS)

Este documento está diseñado para cualquier desarrollador que tome el relevo del proyecto "Editorial Pro", un software SaaS de gestión integral para editoriales. Explica la arquitectura, el flujo de datos, tecnologías clave y decisiones de diseño tomadas hasta la fecha.

## 1. Stack Tecnológico (Front-end)

- **Framework Core**: React 18 (Cargado mediante **Vite**).
- **Enrutamiento**: `react-router-dom` (v6).
- **Estilos**: Tailwind CSS (con variables personalizadas para el modo oscuro y colores primarios).
- **Gestor del Estado del Servidor**: `@tanstack/react-query` (React Query v5).
- **Backend as a Service**: Supabase (Autenticación + Base de Datos PostgreSQL).
- **Iconografía**: `lucide-react`.

## 2. Arquitectura de Datos y Estado Global

### 2.1 Multi-tenancy (Múltiples Inquilinos)

La plataforma opera como un software SaaS puro. Cada cuenta principal de editorial tiene un `tenant_id` (ID de inquilino) único generado por Supabase `gen_random_uuid()`. **Casi todas las tablas de la base de datos incluyen la columna `tenant_id`**. Nunca se debe omitir este filtro (ej: `.eq('tenant_id', tenantId)`) al hacer consultas a Supabase para evitar filtraciones de datos cruzados entre editoriales.

### 2.2 Estrategia de Carga de Datos (The "Big Load")

A diferencia de aplicaciones clásicas que hacen consultas por cada pantalla (lazy fetching), en este sistema buscamos que el sistema se sienta **instantáneo**.

- Todo se carga de un solo golpe al iniciar sesión, usando `loadAllData()` en `src/lib/supabaseService.js`.
- Se ejecuta un enorme `Promise.all()` solicitando libros, inventarios, finanzas, ventas, etc., de un solo `tenant_id`. Todo el resultado se guarda en memoria manejado por React Query.
- La invalidación está definida en `src/hooks/useEditorialData.js`. Al ejecutar *cualquier* mutación (guardar, editar o borrar), se invalida la key `['editorialData', tenantId]`, provocando que React Query actualice el contexto sin refrescar la página, pero sintiéndose ultrarrápido para el usuario.

### 2.3 Proveedor de Contexto (Context API)

`src/context/AuthContext.jsx` actúa como el motor central global ("Single Source of Truth"). Inyecta funciones `login`, `logout` y los metadatos completos provenientes del hook `useEditorialData`. Todos los componentes deben llamar a `useAuth()` para consumir o modificar datos.

### 2.4 Gestión Dinámica de Impuestos (IVA)

A partir de la versión **v3.1.5.77**, el sistema ya no utiliza valores fijos (como `1.19`) para cálculos de impuestos.

- La tasa de impuestos actual (`taxRate`) se consume desde el `useAuth()`.
- Para convertir un valor Bruto a Neto, se debe usar la fórmula: `valorBruto / (1 + taxRate / 100)`.
- Todos los módulos financieros (Ventas, Cotizaciones, Dashboard, Regalías) deben seguir este patrón para asegurar consistencia si la editorial cambia su configuración regional.

## 3. Estructura de Roles y Permisos

Contamos con 4 perfiles en la aplicación:

1. **SUPERADMIN**: Únicamente el dueño original del software (Admin Saas). Controla usuarios, crea tenats, suspende o borra editoriales (`pages/superadmin`).
2. **ADMIN**: El rol predeterminado de los gerentes/dueños de las editoriales. Tienen acceso total a inventario, cajas, finanzas y autores (`layouts/AdminLayout.jsx`).
3. **AUTOR**: Una versión restringida que solo puede ver el estado de su liquidación de regalías (`Royalties`) y libros que le pertenecen.
4. **FREELANCE**: Acceso único e inteligente a `Kanban` para mover libros en el túnel de producción de la editorial.

La seguridad de rutas se administra con el componente `<RouteGuard allowedRoles={[...]} />`.

## 4. Patrones de Diseño de Código

### 4.1 "UI WOW" y Experiencia Premium

La estética nunca es secundaria. Siempre utilizamos:

- "Glassmorphism" (Efecto de cristal translúcido para tarjetas y modales).
- Bordes gruesos (`rounded-[2rem]` o `rounded-[3rem]`).
- Tipografías en `font-black` para cabeceras, sombras profundas (`shadow-xl`) de colores personalizados en los botones.
- Transiciones CSS de `hover` sutiles en los micro-componentes.

### 4.2 Botones Mágicos (Demo Data)

La aplicación cuenta con botones para inyectar *demo data* a base de JSON falso (`seedDemoData` en `supabaseService.js`) que pueden cargarse para enseñar al usuario a usar el software. Cuando el cliente borra el *demo data*, el sistema limpia la base con `delete`.

### 4.3 Componentes de Lazy Loading

Debido a herramientas extremas en `Marketing 3D` (renderizaciones y bibliotecas pesadas), componentes singulares se cargan mediante `React.lazy(() => import(...))` envueltos en bloques de `Suspense`. Replicar este patrón en áreas futuras que demanden mucho procesamiento DOM.

## 5. Notas Importantes sobre Supabase (El Backend)

El cliente Supabase de producción está configurado en `src/lib/supabase.js`.
Todas las consultas directas ("Raw Queries") operan en `src/lib/supabaseService.js`. Si vas a añadir una tabla nueva al software (Ej: "Módulo Cursos"), debes seguir estos pasos:

1. Ejecutar el script SQL creando la tabla en el backend de Supabase directamente (agregando las políticas RLS y la columna `tenant_id`).
2. Agregar el `import` de la mutación a `src/lib/supabaseService.js`.
3. Añadir la tabla al `Promise.all` universal en `loadAllData()`.
4. Crear un hook de modificación respectivo en `useEditorialData.js` usando `useMutation`.
5. Inyectar sus métodos expuestos genéricos (ej: `addNewCourse`) desde el `AuthContext.jsx` hasta la interfaz en donde residirá el HTML del módulo final.

## 6. Comandos útiles (Scripts)

- Ejecutar entorno local en el puerto predeterminado (5173):
  `npm run dev`
- Compilación a producción (Bunde de Vite)
  `npm run build`
- Despliegue en producción (Vercel)
  `npx vercel --prod --yes`

---
*Fin del Manual Técnico. Mantenga viva la innovación y el estándar premium de UI/UX que define al proyecto.*
