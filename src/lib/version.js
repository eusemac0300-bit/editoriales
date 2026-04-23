export const APP_VERSION = 'v3.2.1.2';
export const APP_BUILD = '2026.04.23.006';

export const CHANGELOG = [
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
