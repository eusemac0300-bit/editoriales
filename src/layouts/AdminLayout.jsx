import { useState } from 'react'
import { APP_VERSION } from '../lib/version'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loadPermissions } from '../lib/permissions'
import {
    BookOpen, LayoutDashboard, Package, Kanban, Calculator,
    DollarSign, FileText, Users, Bell, ClipboardList,
    FolderOpen, LogOut, Menu, X, ChevronDown, AlertTriangle, Printer, ShoppingCart, Truck, Contact, FileSpreadsheet, Receipt, Wallet,
    Sun, Moon, Languages, Settings, Percent, Globe, Coins, Sparkles, Database, Trash2, Zap, Building, Tent, PieChart
} from 'lucide-react'

const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'dashboard', end: true },
    { 
        label: 'sales_group', 
        icon: ShoppingCart,
        subItems: [
            { to: '/admin/ventas', label: 'sales' },
            { to: '/admin/eventos', label: 'events' },
            { to: '/admin/consignaciones', label: 'consignments' },
        ]
    },
    { to: '/admin/inventario', icon: Package, label: 'inventory' },
    { to: '/admin/kanban', icon: Kanban, label: 'production' },
    { to: '/admin/cotizaciones', icon: Calculator, label: 'quotes' },
    { to: '/admin/escandallo', icon: Calculator, label: 'escandallo' },
    { to: '/admin/proveedores', icon: Contact, label: 'suppliers' },
    { to: '/admin/clientes', icon: Building, label: 'clients' },
    { to: '/admin/ordenes', icon: FileSpreadsheet, label: 'orders' },
    { to: '/admin/gastos', icon: Receipt, label: 'expenses' },
    { to: '/admin/cashflow', icon: Wallet, label: 'cashflow' },
    { to: '/admin/liquidaciones', icon: DollarSign, label: 'royalties' },
    { to: '/admin/libros', icon: FileText, label: 'titles' },
    { to: '/admin/autores', icon: Users, label: 'authors' },
    { to: '/admin/usuarios', icon: Users, label: 'users' },
    { to: '/admin/documentos', icon: FolderOpen, label: 'documents' },
    { to: '/admin/auditoria', icon: ClipboardList, label: 'audit' },
    { to: '/admin/alertas', icon: Bell, label: 'alerts' },
    { to: '/admin/reportes', icon: PieChart, label: 'reports' },
]

export default function AdminLayout() {
    const {
        user, logout, data, resetWorkspace, loadDemo, clearDemo,
        theme, toggleTheme, language, setLanguage,
        currency, setCurrency, taxRate, setTaxRate, t
    } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [isActionLoading, setIsActionLoading] = useState(false)
    const [openMenus, setOpenMenus] = useState(['sales_group']) // Default open
    const [changelogOpen, setChangelogOpen] = useState(false)
    
    const updates = [
        { version: 'v3.1.5.75', date: '2026-04-15', title: 'Blindaje de Buscadores', details: ['Blindaje global de buscadores (Inventario, Ventas, Eventos, Proveedores) para evitar crashes por valores nulos.'] },
        { version: 'v3.1.5.74', date: '2026-04-14', title: 'Blindaje de Inventario y Auditoría', details: ['Corrección de error crítico (toLowerCase) al buscar títulos inexistentes o eliminados en el inventario.', 'Sincronización de registros de auditoría para movimientos de stock.', 'Mejora en la estabilidad de carga de inventario digital.'] },
        { version: 'v3.1.5.73', date: '2026-04-01', title: 'Localización y Traducción', details: ['Corrección de la traducción del menú "Clientes" en el sidebar.', 'Unificación de términos en los archivos de lenguaje para mayor consistencia.'] },
        { version: 'v3.1.5.72', date: '2026-04-01', title: 'Hotfix: Estabilidad en Ventas', details: ['Corrección de error crítico de importación (AlertTriangle) que impedía abrir el registro de ventas.', 'Mejora en la resiliencia del formulario bajo condiciones de bajo stock.'] },
        { version: 'v3.1.5.71', date: '2026-03-31', title: 'Blindaje de Stock y Ventas', details: ['Desbloqueo de ventas con stock cero: Permite el registro forzado con advertencia visual.', 'Auto-creación de inventario: Si un título no tiene ficha técnica, el sistema la genera automáticamente al vender.', 'Sincronización robusta de salidas físicas para todos los canales.'] },
        { version: 'v3.1.5.70', date: '2026-03-31', title: 'Optimización de Navegación', details: ['Renombrado de "Inventario" a "Inventario / Stock" para facilitar su localización.', 'Mejora en la jerarquía visual del sidebar para módulos críticos.'] },
        { version: 'v3.1.5.69', date: '2026-03-31', title: 'Modo Exploración en Ventas', details: ['Buscador inteligente: click en la lupa despliega automáticamente el catálogo rápido.', 'Soporte para exploración visual de títulos sin necesidad de escribir.', 'Interfaz mejorada en la selección de ítems con mayor detalle de ISBN y PVP.'] },
        { version: 'v3.1.5.68', date: '2026-03-31', title: 'Dashboard Premium v3 (Sincronía Total)', details: ['Integración total de la estética de Despacho en el Dashboard de Ventas.', 'Oscurecimiento de tarjetas KPI para eliminar contrastes excesivos.', 'Barra de filtros y búsqueda rediseñada con fondos profundos y bordes sutiles.'] },
        { version: 'v3.1.5.67', date: '2026-03-31', title: 'Sincronización Estética Despacho/Ventas', details: ['Restauración de paleta de colores oscuro (Dark Mode) en Ventas.', 'Uso de fondos slate-900 e inputs integrados para coherencia visual.', 'Botones de acción en azul vibrante siguiendo el patrón de Despacho.'] },
        { version: 'v3.1.5.66', date: '2026-03-31', title: 'Optimización de Legibilidad en Ventas', details: ['Cambio a esquema de colores claro (Light Mode) en formularios para facilitar la lectura.', 'Mejora de contrastes en campos de búsqueda y tablas de artículos.', 'Refinado de bordes y sombras para una apariencia técnica limpia.'] },
        { version: 'v3.1.5.65', date: '2026-03-31', title: 'Gestión de Autores y UI Premium v2', details: ['Soporte para indicadores visuales de autores (Ticket Azul/Rojo).', 'Refactorización final de Ventas con alto contraste.', 'Corrección definitiva de corrupción de código en formularios.', 'Optimización de espacio en selectores de autor.'] },
        { version: 'v3.1.5.63', date: '2026-03-31', title: 'Nueva Ventana Premium y Alta Visibilidad', details: ['Rediseño completo del formulario de ventas con alto contraste.', 'Controles de inventario blindados y cálculo de impuestos en tiempo real.', 'Corrección de errores de sintaxis en el módulo administrativo.'] },
        { version: 'v3.1.5.62', date: '2026-03-31', title: 'Refactorización UI Ventas', details: ['Estética Premium y Glassmorphism en paneles.', 'Nueva analítica por canal de ventas.', 'Mejora en KPIs de rendimiento mensual.'] },
        { version: 'v3.1.5.29', date: '2026-03-30', title: 'Robustez Maestro & Corrección Autores', details: ['Sincronización global de versión v29.', 'Registro de autores y proveedores blindado para usuario Maestro.', 'Mapeo automático de tenant_id MASTER a root UUID.', 'Diagnóstico de errores detallado en formularios.'] },
        { version: 'v3.1.5.18', date: '2026-03-26', title: 'Auditoría Final & Sincro Maestro', details: ['Restauración de enlace "Informes" en Sidebar.', 'Botón "Cargar Datos Demo" reactivado en Dashboard.', 'Robustez de guardado: Fallback para columnas de PDF faltantes.', 'Sección de Marketing ocultada temporalmente por desarrollo.'] },
        { version: 'v3.1.5.17', date: '2026-03-25', title: 'The True Sync & Auth Fix', details: ['Fuerza de sincronización v17.', 'Corrección del enlace de sesión tenant-ID', 'Visibilidad completa de datos Demo.'] },
        { version: 'v3.1.5.15', date: '2026-03-25', title: 'The Real Sync & Atomic Refresh', details: ['Fuerza de sincronización v15.', 'Refresco de página automático tras carga demo.', 'Blindaje de detector de libros ffffffff-.'] },
        { version: 'v3.1.5.8', date: '2026-03-25', title: 'Universal Sync & Master Hub', details: ['Motor de Demos Universal con IDs UUID.', 'Centro de Control Maestro con visibilidad robusta.', 'Sincronización de Base de Datos para lanzamientos globales.'] },
        { version: 'v3.1.5.7', date: '2026-03-25', title: 'Onboarding & Demo Experience', details: ['Botones claros para Cargar vs Borrar Datos de Ejemplo.', 'Nueva opción "Vaciar Suite" para reset de fábrica.', 'Mejora en visibilidad de opciones iniciales para clientes nuevos.'] },
        { version: 'v3.1.5.6', date: '2026-03-23', title: 'Sincronización Trial & Demo v2', details: ['Sincronización de datos demo con nuevas funcionalidades.', 'Forzado de despliegue Vercel.', 'Corrección de indicadores de versión en Login/Landing.'] },
        { version: 'v3.1.5.5', date: '2026-03-23', title: 'Flujo Ciclo Editorial (Manual v1)', details: ['Fórmula de Regalías sobre PVP Neto (10%).', 'Gestión de Contratos con estados y vencimientos.', 'Cuentas por Cobrar con alertas de atraso.', 'Descuento automático para Distribuidoras (60%).'] },
        { version: 'v3.1.5.4', date: '2026-03-23', title: 'Navegación y Estabilidad', details: ['Navegación directa al libro desde consignas.', 'Corrección de error en lista expandida.', 'Optimización de renders en tablas.'] },
        { version: 'v3.1.5.3', date: '2026-03-23', title: 'Ajustes en Ventas', details: ['Restauración de iconos en reporte de ventas.', 'Alineación profesional de columnas monetarias.'] },
        { version: 'v3.1.5.2', date: '2026-03-23', title: 'Lanzamiento Maestro Oficial', details: ['Control total para master@editorial.cl.', 'Dashboard de Consignaciones refinado.', 'Estabilidad en conexión Vercel-GitHub.'] },
        { version: 'v3.1.5.1', date: '2026-03-23', title: 'Dashboard de Consignaciones y Corrección de PDFs', details: ['Nuevo panel de KPIs en Consignaciones (Capital en la calle, stock en tránsito).', 'Corrección de mapeo de datos: PDFs de Interior y Tapa ahora visibles en la ficha técnica.', 'Alertas visuales de despachos sin movimiento (más de 60 días).'] },
        { version: 'v3.1.5', date: '2026-03-23', title: 'Inteligencia de Stock y Ventas', details: ['Visualización de stock en tiempo real en títulos.', 'Identificación de Bestsellers y alertas de quiebre.', 'Flujo profesional de actualizaciones (Master User).', 'Nueva arquitectura de ramas para estabilidad SaaS.'] },
        { version: 'v3.1.4', date: '2026-03-22', title: 'Sincronización de Ventas', details: ['Separación de ventas Firmes vs Flotantes.', 'Reporting acumulado por rango de fechas.', 'Gestión de metas de venta mensuales.'] }
    ]

    const toggleMenu = (label) => {
        setOpenMenus(p => p.includes(label) ? p.filter(m => m !== label) : [...p, label])
    }

    const hasDemoData = data?.books?.some(b => b.id.startsWith('demo_'))
    const hasBooks = data?.books?.length > 0
    const unreadAlerts = data?.alerts?.filter(a => !a.read).length || 0

    const permissions = loadPermissions()
    const userRole = user?.role || 'ADMIN'
    const allowedModules = permissions[userRole] || permissions['ADMIN']

    const moduleTranslationMap = {
        'dashboard': 'Dashboard', 'inventory': 'Inventario', 'production': 'Producción',
        'escandallo': 'Escandallo (Costos)', 'quotes': 'Cotizaciones', 'sales': 'Ventas',
        'consignments': 'Consignaciones', 'suppliers': 'Proveedores', 'orders': 'Órdenes de Compra',
        'expenses': 'Gastos', 'cashflow': 'Flujo de Caja', 'royalties': 'Liquidaciones',
        'titles': 'Títulos', 'authors': 'Autores', 'users': 'Usuarios',
        'documents': 'Documentos', 'audit': 'Auditoría', 'alerts': 'Alertas', 'marketing': 'Marketing', 'marketing_3d': 'Marketing 3D', 'clients': 'Clientes', 'events': 'Ferias y Eventos',
        'sales_group': 'Ventas', 'reports': 'Informes'
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const handleReset = async () => {
        if (window.confirm(t('reset_warning'))) {
            setIsResetting(true)
            const success = await resetWorkspace()
            setIsResetting(false)
            setSettingsOpen(false)
            if (success) {
                navigate('/admin')
            }
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-dark-100 border-r border-slate-800 dark:border-dark-300 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800 dark:border-dark-300">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-lg shadow-primary/20">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-sm">Editorial Pro</h1>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-tight">
                                {t('admin_panel')} <span className="text-primary-400 block font-semibold italic">{APP_VERSION} (PRODUCTION READY)</span>
                            </p>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-slate-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {navItems
                            .filter(item => {
                                if (item.subItems) return true // Groups always show if any subItem is allowed
                                return allowedModules[moduleTranslationMap[item.label]] !== false
                            })
                            .map(item => {
                                if (item.subItems) {
                                    const allowedSubItems = item.subItems.filter(sub => allowedModules[moduleTranslationMap[sub.label]] !== false)
                                    if (allowedSubItems.length === 0) return null

                                    const isOpen = openMenus.includes(item.label)
                                    
                                    return (
                                        <div key={item.label} className="space-y-1">
                                            <button 
                                                onClick={() => toggleMenu(item.label)}
                                                className={`w-full sidebar-link justify-between group ${isOpen ? 'bg-slate-800/50 text-white' : ''}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon className="w-4 h-4" />
                                                    <span>{t(item.label)}</span>
                                                </div>
                                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            
                                            {isOpen && (
                                                <div className="pl-9 pr-2 space-y-1 animate-in slide-in-from-top-2 duration-300">
                                                    {allowedSubItems.map(sub => (
                                                        <NavLink
                                                            key={sub.to}
                                                            to={sub.to}
                                                            onClick={() => setSidebarOpen(false)}
                                                            className={({ isActive }) => isActive ? 'sidebar-sublink-active' : 'sidebar-sublink'}
                                                        >
                                                            <span>{t(sub.label)}</span>
                                                        </NavLink>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                }

                                return (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.end}
                                        onClick={() => setSidebarOpen(false)}
                                        className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        <span>{t(item.label)}</span>
                                        {item.label === 'alerts' && unreadAlerts > 0 && (
                                            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                                {unreadAlerts}
                                            </span>
                                        )}
                                    </NavLink>
                                )
                            })}
                    </nav>
                </div>
            </aside>

            {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            <main className="flex-1 lg:ml-64">
                <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-300 flex items-center px-4 gap-4 transition-colors">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-200 text-slate-600 dark:text-dark-700">
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex-1" />

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end mr-1 sm:mr-2">
                             <span className="text-[9px] font-black text-primary-500 dark:text-primary-400 tracking-[0.2em] uppercase hidden sm:block italic">Maestro Sincronizado</span>
                             <span className="text-[10px] font-black text-white bg-primary px-2 py-0.5 rounded-full sm:mt-0.5 border border-primary-400 shadow-lg shadow-primary/30 animate-pulse">{APP_VERSION}</span>
                        </div>

                        <button 
                            onClick={() => setChangelogOpen(true)}
                            className="relative flex items-center gap-2 p-2 px-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-all text-primary group"
                            title="Novedades"
                        >
                            <Sparkles className="w-4 h-4 animate-pulse group-hover:scale-120 group-hover:rotate-12 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Novedades</span>
                        </button>

                        <div className="h-4 w-px bg-slate-200 dark:bg-dark-300 mx-1" />

                        {unreadAlerts > 0 && (
                            <button onClick={() => navigate('/admin/alertas')} className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-200 transition-all group">
                                <Bell className="w-5 h-5 text-slate-600 dark:text-dark-700 group-hover:text-primary dark:group-hover:text-primary-300" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-dark pulse-glow" />
                            </button>
                        )}

                        <div className="h-8 w-px bg-slate-200 dark:bg-dark-300 mx-1" />

                        {/* Settings Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setSettingsOpen(!settingsOpen)}
                                className={`flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-all ${settingsOpen ? 'bg-primary/5 border-primary/20 ring-4 ring-primary/5' : 'bg-slate-50 dark:bg-dark-200 border-slate-200 dark:border-dark-300 hover:border-slate-300 dark:hover:border-dark-400'}`}
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    {user?.avatar || 'U'}
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{APP_VERSION} (Editorial Pro)</p>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {settingsOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)} />
                                    <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-dark-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-dark-300 z-50 overflow-hidden slide-up">
                                        <div className="p-4 border-b border-slate-100 dark:border-dark-300 bg-slate-50/50 dark:bg-dark-50/10">
                                            <p className="text-xs font-bold text-slate-400 dark:text-dark-600 uppercase tracking-widest mb-3">{t('settings')}</p>

                                            <div className="space-y-4">
                                                {/* Theme Toggle */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-dark-900">
                                                        {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                                                        <span className="text-sm font-medium">{theme === 'dark' ? t('theme_dark') : t('theme_light')}</span>
                                                    </div>
                                                    <button onClick={toggleTheme} className="w-10 h-6 rounded-full bg-slate-200 dark:bg-dark-300 p-1 relative transition-colors border border-slate-300 dark:border-dark-400">
                                                        <div className={`w-4 h-4 rounded-full shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-4 bg-primary' : 'translate-x-0 bg-white'}`} />
                                                    </button>
                                                </div>

                                                {/* Language Selector */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-dark-900">
                                                        <Globe className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{t('language')}</span>
                                                    </div>
                                                    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-dark-200 rounded-lg">
                                                        {['es', 'en', 'pt'].map(lang => (
                                                            <button
                                                                key={lang}
                                                                onClick={() => {
                                                                    setLanguage(lang)
                                                                    localStorage.setItem('language', lang)
                                                                }}
                                                                className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${language === lang ? 'bg-white dark:bg-dark-50 shadow-sm text-primary' : 'text-slate-500 dark:text-dark-600 hover:text-slate-700 dark:hover:text-dark-900'}`}
                                                            >
                                                                {lang}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Currency Selector */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-dark-900">
                                                        <Coins className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{t('currency')}</span>
                                                    </div>
                                                    <select
                                                        value={currency}
                                                        onChange={(e) => {
                                                            setCurrency(e.target.value)
                                                            localStorage.setItem('currency', e.target.value)
                                                        }}
                                                        className="w-full bg-slate-100 dark:bg-dark-200 border-none rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-primary"
                                                    >
                                                        <option value="CLP">CLP (Chilean Peso)</option>
                                                        <option value="USD">USD (US Dollar)</option>
                                                        <option value="EUR">EUR (Euro)</option>
                                                        <option value="BRL">BRL (Real)</option>
                                                    </select>
                                                </div>

                                                {/* Tax Rate */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-dark-900">
                                                        <Percent className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{t('tax_rate')}</span>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={taxRate}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value) || 0
                                                                setTaxRate(val)
                                                                localStorage.setItem('tax_rate', val)
                                                            }}
                                                            className="w-full bg-slate-100 dark:bg-dark-200 border-none rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-primary pr-8"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 dark:text-dark-500">%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>


                                        <div className="p-2 space-y-1">
                                            {user?.role !== 'SUPERADMIN' && (
                                                <button
                                                    onClick={handleReset}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all text-xs font-bold uppercase tracking-tight"
                                                >
                                                    <AlertTriangle className="w-4 h-4" />
                                                    {isResetting ? t('loading') : t('reset_workspace')}
                                                </button>
                                            )}

                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-xs font-bold uppercase tracking-tight"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                {t('logout')}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>

            {/* Changelog Modal */}
            {changelogOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-dark-100 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-dark-300 slide-up">
                        <div className="relative p-6 bg-gradient-to-br from-primary to-primary-700 text-white">
                            <button 
                                onClick={() => setChangelogOpen(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 rounded-2xl">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Novedades</h2>
                                    <p className="text-xs text-white/70">Mejoras continuas para tu editorial</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-8 bg-slate-50 dark:bg-dark-50">
                            {updates.map((update, idx) => (
                                <div key={update.version} className="relative pl-6 border-l-2 border-primary/20 last:border-l-transparent">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white dark:border-dark-100 shadow-sm" />
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                                            {update.version}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-dark-500 italic">
                                            {update.date}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{update.title}</h3>
                                    <ul className="space-y-2">
                                        {update.details.map((detail, dIdx) => (
                                            <li key={dIdx} className="text-xs text-slate-600 dark:text-dark-700 flex items-start gap-2">
                                                <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                                                {detail}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        
                        <div className="p-4 bg-white dark:bg-dark-100 border-t border-slate-100 dark:border-dark-300 flex justify-end">
                            <button 
                                onClick={() => setChangelogOpen(false)}
                                className="btn-primary w-full sm:w-auto px-10 h-10 text-xs shadow-lg shadow-primary/20"
                            >
                                Entendido, ¡gracias!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
