export const APP_VERSION = 'v3.2.0.16';
export const APP_BUILD = '2026.04.23.001';

export const CHANGELOG = [
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
