export const APP_VERSION = 'v3.2.0.12';

export const CHANGELOG = [
    {
        version: 'v3.2.0.07',
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
