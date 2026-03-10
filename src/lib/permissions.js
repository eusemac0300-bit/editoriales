export const MODULES = [
    'Dashboard', 'Inventario', 'Producción', 'Escandallo', 'Cotizaciones',
    'Ventas', 'Consignaciones', 'Liquidaciones', 'Proveedores', 'Órdenes', 'Gastos',
    'Títulos', 'Autores', 'Usuarios', 'Documentos', 'Auditoría', 'Alertas'
]

export const DEFAULT_PERMISSIONS = {
    SUPERADMIN: {
        'Dashboard': true, 'Inventario': true, 'Producción': true, 'Escandallo': true, 'Cotizaciones': true,
        'Ventas': true, 'Consignaciones': true, 'Liquidaciones': true, 'Proveedores': true,
        'Órdenes': true, 'Gastos': true, 'Títulos': true, 'Autores': true, 'Usuarios': true,
        'Documentos': true, 'Auditoría': true, 'Alertas': true
    },
    ADMIN: {
        'Dashboard': true, 'Inventario': true, 'Producción': true, 'Escandallo': true, 'Cotizaciones': true,
        'Ventas': true, 'Consignaciones': true, 'Liquidaciones': true, 'Proveedores': true,
        'Órdenes': true, 'Gastos': true, 'Títulos': true, 'Autores': true, 'Usuarios': true,
        'Documentos': true, 'Auditoría': true, 'Alertas': true
    },
    VENDEDOR: {
        'Dashboard': true, 'Inventario': true, 'Producción': false, 'Escandallo': false, 'Cotizaciones': true,
        'Ventas': true, 'Consignaciones': true, 'Liquidaciones': false, 'Títulos': true, 'Autores': false,
        'Usuarios': false, 'Documentos': false, 'Auditoría': false, 'Alertas': true
    },
    EDITOR: {
        'Dashboard': true, 'Inventario': false, 'Producción': true, 'Escandallo': false, 'Cotizaciones': false,
        'Ventas': false, 'Consignaciones': false, 'Liquidaciones': false, 'Títulos': true, 'Autores': true,
        'Usuarios': false, 'Documentos': true, 'Auditoría': false, 'Alertas': true
    },
    FREELANCE: {
        'Dashboard': false, 'Inventario': false, 'Producción': true, 'Escandallo': false, 'Cotizaciones': false,
        'Ventas': false, 'Consignaciones': false, 'Liquidaciones': false, 'Títulos': false, 'Autores': false,
        'Usuarios': false, 'Documentos': false, 'Auditoría': false, 'Alertas': false
    }
}

export function loadPermissions() {
    try {
        const saved = localStorage.getItem('editorial_permissions')
        if (saved) return JSON.parse(saved)
    } catch { }
    return DEFAULT_PERMISSIONS
}
