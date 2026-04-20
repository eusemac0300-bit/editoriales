# Guía de Navegación y Estructura: Editorial Pro

Esta guía detalla el "mapa de navegación" de la plataforma, un storyboard para la creación del video explicativo y el prompt para utilizar en NotebookLM.

## 1. Plano de Navegación (User Journey)

La plataforma está diseñada para seguir el ciclo de vida natural de un libro. Aquí está el recorrido lógico:

### Fase A: Cimiento del Catálogo
1.  **Autores** (`/admin/autores`): Registro de la propiedad intelectual y perfiles de los creadores.
2.  **Títulos (Libros)** (`/admin/libros`): Creación de fichas técnicas (ISBN, PVP, Sinopsis).
3.  **Escandallo** (`/admin/escandallo`): Análisis de costos unitarios. Aquí defines si el libro es viable financieramente.

### Fase B: Abastecimiento y Producción
4.  **Proveedores** (`/admin/proveedores`): Registro de imprentas y prestadores de servicios.
5.  **Producción (Kanban)** (`/admin/kanban`): Seguimiento visual del progreso editorial (Edición, Diseño, Impresión).
6.  **Órdenes de Compra** (`/admin/ordenes`): Registro oficial de pedidos a proveedores para alimentar el stock.

### Fase C: Operación y Comercialización
7.  **Inventario** (`/admin/inventario`): Monitoreo de stock físico y digital.
8.  **Ventas** (`/admin/ventas`): Registro de transacciones directas con el nuevo selector inteligente de clientes.
9.  **Consignaciones** (`/admin/consignaciones`): Gestión de libros en librerías externas. Es vital para saber qué libros están "fuera" pero aún no vendidos.
10. **Eventos** (`/admin/eventos`): Control de ventas masivas en ferias del libro.

### Fase D: Finanzas y Control de Gestión
11. **Gastos** (`/admin/gastos`): Registro de facturas y costos operativos.
12. **Cashflow** (`/admin/cashflow`): Salud financiera en tiempo real.
13. **Liquidaciones** (`/admin/liquidaciones`): Pago de regalías a autores.
14. **Reportes** (`/admin/reportes`): Análisis agregado de toda la operación.

---

## 2. Storyboard para Video Explicativo

Si decides grabar un video, te sugiero esta estructura de 3 minutos:

| Tiempo | Escena | Descripción Visual | Narrativa (Voz en off) |
| :--- | :--- | :--- | :--- |
| 0:00 - 0:30 | **El Inicio** | Muestra el **Dashboard** con sus KPIs. | "Bienvenido a Editorial Pro. Tu centro de comando editorial donde controlamos cada aspecto, desde la idea hasta la venta." |
| 0:30 - 1:00 | **El Catálogo** | Navega por **Libros** y muestra un **Escandallo**. | "Todo empieza aquí: gestionando autores y libros, y analizando los costos de producción para asegurar la rentabilidad." |
| 1:00 - 1:45 | **Ventas y Clientes** | Registra una **Venta** rápida usando el selector de clientes. | "Vender es más fácil que nunca. Selecciona el cliente, busca el título por nombre o ISBN y genera la transacción en segundos." |
| 1:45 - 2:30 | **Control Total** | Muestra el **Inventario** y las **Consignaciones**. | "Mantén el control de tu stock físico y lo que tienes en consignación. Nunca más pierdas un libro de vista." |
| 2:30 - 3:00 | **Cierre Financiero** | Muestra **Cashflow** y **Liquidaciones**. | "Termina el ciclo pagando regalías a tus autores y revisando la salud de tu flujo de caja. Editorial Pro, orden para tu pasión." |

---

## 3. Prompt para NotebookLM

Para usar NotebookLM como un consultor de tu plataforma, copia y pega el siguiente texto como "Instrucción de Fuente" o en el chat principal después de cargar tus documentos (o este mismo archivo):

> "Eres el Consultor Experto en la plataforma 'Editorial Pro' versión v3.1.5.80. Tu objetivo es ayudar al usuario a navegar por la plataforma y entender sus flujos de trabajo.
> 
> **Contexto de la plataforma:**
> - Es un sistema ERP editorial que gestiona: Autores, Títulos, Inventario, Ventas, Consignaciones y Finanzas (Escandallo, Cashflow, Regalías).
> - Funcionalidad clave reciente: Selector inteligente de clientes con creación rápida en el módulo de ventas.
> 
> **Tu tarea:**
> 1. Responde preguntas sobre cómo realizar procesos (ej: '¿Cómo registro una venta?', '¿Cómo analizo el costo de un libro?').
> 2. Proporciona resúmenes de la estructura operativa basada en el manual de navegación.
> 3. Ayuda a diagnosticar dónde debería buscar el usuario cierta información (ej: 'Busca en Consignaciones para ver stock en librerías').
> 
> Mantén un tono profesional, técnico pero accesible, enfocado en la eficiencia operativa de una editorial moderna."

---

> [!TIP]
> Puedes abrir el módulo de "Ayuda y Guía" en tu panel de administración para acceder a estos recursos de forma interactiva.
