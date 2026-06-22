export const APP_VERSION = 'v3.2.3.19';
export const APP_BUILD = '2026.06.22.004';

export const CHANGELOG = [
    {
        version: 'v3.2.3.19',
        date: '2026-06-22',
        title: 'Fix: Logo persiste para todos los usuarios',
        details: [
            'Se agrega la columna logo_url a la tabla tenants en Supabase (migración SQL incluida).',
            'La función updateTenantLogoInDb ahora guarda el logo realmente en la base de datos.',
            'El flujo de login (normal y master) ahora carga logo_url y tenantName desde la BD.',
            'Todos los usuarios del mismo tenant ahora ven el logo actualizado al iniciar sesión.'
        ]
    },
    {
        version: 'v3.2.3.18',
        date: '2026-06-22',
        title: 'Personalización de Marca: Editorial Client',
        details: [
            'Se agregó una caja contenedora en el panel lateral superior izquierdo que muestra dinámicamente el logo de la editorial.',
            'Se muestra el nombre de la editorial de manera personalizada en el panel lateral y menú de usuario.',
            'En caso de no tener logo configurado, se muestra un ícono representativo de forma predeterminada.'
        ]
    },
    {
        version: 'v3.2.3.17',
        date: '2026-06-22',
        title: 'Hotfix: Adblockers & Upload Fetch Error',
        details: [
            'Se cambió la ruta de almacenamiento de branding/logo_ a assets/img_ para evitar bloqueos por Adblockers (Brave, uBlock, etc).',
            'Se transforman los archivos a ArrayBuffer nativo previo a la carga para evitar desconexiones en el FormData de la petición Fetch.'
        ]
    },
    {
        version: 'v3.2.3.16',
        date: '2026-06-22',
        title: 'Hotfix: Safari Upload Logo',
        details: [
            'Corregido el error "Failed to fetch" al cargar un logo (problema relacionado a la limpieza prematura de URLs en memoria).'
        ]
    },
    {
        version: 'v3.2.3.15',
        date: '2026-05-25',
        title: 'Logo en Órdenes de Compra',
        details: [
            'Se añade el logo de la editorial en los PDFs generados desde el módulo de Órdenes de Compra, alineando el diseño con las cotizaciones.'
        ]
    },
    {
        version: 'v3.2.3.14',
        date: '2026-05-25',
        title: 'Detalle visual en PDFs',
        details: [
            'Se recorta la línea divisoria horizontal en cotizaciones y OC para que no cruce por encima del logo de la editorial.'
        ]
    },
    {
        version: 'v3.2.3.13',
        date: '2026-05-25',
        title: 'Mejora en Exportación de PDFs (Cotizaciones y O.C.)',
        details: [
            'Ajustado el diseño de cabecera en PDFs de cotización y órdenes de compra para evitar que el texto "Fecha" y "ID Ref" quede debajo del logo de la editorial.'
        ]
    },
    {
        version: 'v3.2.3.12',
        date: '2026-05-25',
        title: 'Hotfix: Actualización de Estado de Logo',
        details: [
            'Corregido error "e is not a function" al intentar actualizar el logo en el contexto global tras una subida exitosa.'
        ]
    },
    {
        version: 'v3.2.3.11',
        date: '2026-05-25',
        title: 'Solución a Carga de Logos',
        details: [
            'Agregada instrucción de creación de bucket para logos de editoriales.'
        ]
    },
    {
        version: 'v3.2.1.4',
        date: '2026-05-19',
        title: 'Auto-recuperación de Sesiones Huérfanas e Inline Author Fix',
        details: [
            'Seguridad: Cierre de sesión automático para sesiones locales (localStorage) huérfanas después de borrar base de datos.',
            'Libros: Solucionado error de creación de autores inline ("desde acá") en formularios de libros.',
            'Flujo: Redirección automática a inicio de sesión tras detección de sesión inválida.'
        ]
    },
    {
        version: 'v3.2.1.3',
        date: '2026-05-19',
        title: 'Estabilización de Flujo y Directorio de Autores',
        details: [
            'Autores: Correo y contraseña opcionales con autogeneración inteligente.',
            'Seguridad: Bloqueo de autocompletado en formularios para evitar pisar credenciales.',
            'Libros: Alerta visual explicativa cuando se selecciona un autor con datos pendientes.',
            'Compras: Creación de proveedores integrada in-line dentro del formulario de OCs.',
            'Consignaciones: Corregido bloqueo de interfaz por bucle infinito al seleccionar Distribución.'
        ]
    },
    {
        version: 'v3.2.1.2',
        date: '2026-04-23',
        title: 'Restauración Estructural: Interfaz Original',
        details: [
            'Reversión total de cambios visuales en el Escandallo.',
            'Restauración de espaciados, fuentes y flujo vertical original.',
            'Eliminación de compactación de márgenes para mantener el diseño clásico.'
        ]
    },
    {
        version: 'v3.2.1.1',
        date: '2026-04-23',
        title: 'Optimización de Interfaz: Escandallo Compacto',
        details: [
            'Restaurado diseño de formulario extendido (visibilidad total sin pestañas).',
            'Optimización de espacios (paddings/gaps) y tamaños de fuente para maximizar datos en pantalla.',
            'Consolidación de paneles de resultados para agilizar la lectura de utilidad neta.'
        ]
    },
    {
        version: 'v3.2.1.0',
        date: '2026-04-23',
        title: 'Optimización de Interfaz: Escandallo Pro',
        details: [
            'Rediseño completo de la calculadora de Escandallo usando pestañas (Costos, Parámetros, Regalías).',
            'Implementación de secciones colapsables para maximizar la visibilidad "at a glance".',
            'Panel de resumen financiero persistente durante la edición.',
            'Corrección de compatibilidad en el tour virtual (background-clip).'
        ]
    },
    {
        version: 'v3.2.0.18',
        date: '2026-04-23',
        title: 'Hotfix: Creación y Acceso de Usuarios',
        details: [
            'Corregido error en la generación de IDs de nuevos usuarios que impedía el ingreso inicial.',
            'Forzado de flujo de bienvenida para todos los nuevos perfiles (incluyendo administradores).',
            'Estabilización del puente de autenticación local.'
        ]
    },
    {
        version: 'v3.2.0.17',
        date: '2026-04-23',
        title: 'Gestión de Accesos: Reinicio de Bienvenida',
        details: [
            'Nuevo botón "Reiniciar Bienvenida" en edición de usuarios: Resetea el proceso para que el usuario elija su propia clave.',
            'Solucionado bloqueo en el guardado de credenciales del SuperAdmin.',
            'Asignación automática de clave temporal "bienvenido123" en procesos de reset.'
        ]
    },
    {
        version: 'v3.2.0.16',
        date: '2026-04-23',
        title: 'Seguridad y UX: Visibilidad de Contraseñas',
        details: [
            'Añadida funcionalidad de "Ojito" (Show/Hide) en el Login para evitar errores de escritura.',
            'Implementada visualización de clave en el Modal de Edición de Usuarios del SuperAdmin.',
            'Sincronización global del sistema de novedades con el registro maestro.'
        ]
    },
    {
        version: 'v3.2.0.15',
        date: '2026-04-23',
        changes: [
            'Habilitada edición global de usuarios para SuperAdmin (Reset de passwords)',
            'Nuevo modal de credenciales en el Panel Master',
            'Corrección de visualización de menús administrativos'
        ]
    },
    {
        version: 'v3.2.0.13',
        date: '2026-04-23',
        changes: [
            'Corrección de error crítico al crear eventos (validación de tenant_id)',
            'Mejora de robustez en liquidación y actualización de ferias',
            'Sincronización de argumentos en hooks de ferias'
        ]
    },
    {
        version: 'v3.2.0.06',
        date: '2026-04-22',
        changes: [
            'Permitir edición completa de ferias y eventos (configuración de libros)',
            'Validación estricta de stock al crear o editar ferias',
            'Ajuste automático de inventario al modificar cantidades despachadas',
            'Indicadores visuales de stock insuficiente en el formulario de ferias'
        ]
    }
];
