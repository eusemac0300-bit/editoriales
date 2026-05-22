# Respaldo de Lógica y Arquitectura - Editorial Pro (SaaS)

**Versión Actual:** 3.2.3.10  
**Contacto / Responsable:** eusemac@me.com  
**Fecha de Respaldo:** 22 de Mayo de 2026

Este documento constituye el respaldo lógico y técnico del software SaaS "Editorial Pro", destinado a cualquier programador externo que deba comprender la arquitectura, el flujo de datos y las decisiones técnicas implementadas hasta la versión actual.

---

## 1. Naturaleza del Proyecto y Arquitectura General
Editorial Pro es un sistema SaaS (Software as a Service) puro, diseñado para la gestión integral de editoriales. La arquitectura sigue un modelo **Multi-tenant**, lo que significa que múltiples editoriales (inquilinos) comparten la misma base de datos, pero sus datos están estrictamente aislados mediante un `tenant_id`.

- **Frontend:** React 18 con Vite, manejando rutas protegidas con React Router v6.
- **Backend y Base de Datos:** Supabase (PostgreSQL), encargado de la autenticación, base de datos en tiempo real y almacenamiento (Storage) para imágenes y PDFs.
- **Estilos y UI:** Tailwind CSS y un enfoque fuerte en diseño "Premium/WOW" con efectos Glassmorphism, animaciones suaves y tipografía jerárquica.

---

## 2. Flujo de Datos (The "Big Load")
Para garantizar una experiencia de usuario que se sienta "instantánea", el sistema evita hacer múltiples consultas (lazy fetching) a lo largo de las páginas.

1. **Carga Inicial:** Al iniciar sesión, se dispara una función llamada `loadAllData()` (ubicada en `src/lib/supabaseService.js`).
2. **Promesa Concurrente:** Un `Promise.all()` gigante extrae todas las tablas esenciales (libros, ventas, eventos, usuarios, inventario, etc.) filtrando exclusivamente por el `tenant_id` de la editorial logueada.
3. **Estado Global:** Todos los datos se almacenan en caché usando `@tanstack/react-query` y se consumen a través del Contexto (`AuthContext.jsx`).
4. **Mutaciones:** Cualquier cambio (agregar, editar, eliminar) se ejecuta en la base de datos de Supabase e inmediatamente invalida la caché local, forzando a React Query a sincronizar el estado sin refrescar el navegador.

---

## 3. Lógica de Seguridad y Multi-tenancy
- **Autenticación:** Gestionada a través de `supabase.auth`. El ID del usuario está vinculado a un perfil en la base de datos (`profiles`), que a su vez contiene el `tenant_id` al que pertenece y su `role`.
- **Row Level Security (RLS):** Toda la base de datos está protegida por políticas RLS en Supabase. Las tablas (ventas, libros, etc.) siempre deben consultarse y mutarse incluyendo el `tenant_id` para garantizar que un cliente nunca vea datos de otro.

### Perfiles de Usuario (Roles)
1. **SUPERADMIN:** Acceso a métricas globales de la plataforma, gestión de nuevas editoriales, suscripciones y configuración del sistema.
2. **ADMIN:** Gerente de una editorial. Acceso total a módulos financieros, inventario, stock crítico y métricas (Dashboard).
3. **AUTOR:** Visualiza únicamente sus regalías, liquidaciones y las ventas de sus libros asignados.
4. **FREELANCE:** Rol acotado a la producción, con acceso al Kanban (túnel de producción de nuevos títulos).

---

## 4. Estructuras Críticas (Finanzas y Stock)
### Módulo de Ventas y Finanzas
- **Gestión Dinámica de Impuestos:** El IVA/Tax ya no está en crudo en el código. Se lee dinámicamente desde el contexto global (`taxRate`). Los cálculos para extraer precios netos o impuestos de precios brutos utilizan fórmulas dinámicas, de modo que el software puede operar en diferentes países.
- **Ventas (Sales):** Registran transacciones con múltiples libros y gestionan un sumario mensual/YTD (Year to Date) en el Dashboard.

### Módulo de Inventario (Stock Crítico)
- Cada libro posee un inventario que es modificado transaccionalmente cuando hay ventas.
- El sistema incluye lógicas para alertar sobre **Stock Crítico**, usando umbrales (`min_stock_level`) definidos por cada título, advirtiendo al `ADMIN` cuándo es momento de imprimir más ejemplares.

---

## 5. Decisiones de Diseño y UI/UX
La interfaz debe reflejar "Alta Calidad" en todo momento:
- Se hace uso de componentes como `<Card>` y `<Modal>` con bordes redondeados pronunciados (`rounded-3xl` o similar).
- Colores en modo oscuro pulidos con sombras internas y externas (`shadow-xl`, `backdrop-blur`).
- Animaciones ligeras (ej: uso de `framer-motion`) y *micro-interacciones* en botones (hover, active).

## 6. Siguientes Pasos y Comandos de Desarrollo
El despliegue está automatizado con Vercel. 
Para levantar el sistema de manera local, el programador entrante solo debe:
1. Clonar el repositorio.
2. Instalar dependencias con `npm install`.
3. Crear un archivo `.env` tomando como referencia las credenciales de Supabase del proyecto.
4. Ejecutar `npm run dev`.

---
*Fin del Respaldo de Lógica para eusemac@me.com.*
