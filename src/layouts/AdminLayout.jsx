import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loadPermissions } from '../lib/permissions'
import {
    BookOpen, LayoutDashboard, Package, Kanban, Calculator,
    DollarSign, FileText, Users, Bell, ClipboardList,
    FolderOpen, LogOut, Menu, X, ChevronDown, AlertTriangle, Printer, ShoppingCart, Truck, Contact, FileSpreadsheet, Receipt, Wallet,
    Sun, Moon, Languages, Settings, Percent, Globe, Coins, Sparkles, Database, Trash2
} from 'lucide-react'

const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'dashboard', end: true },
    { to: '/admin/inventario', icon: Package, label: 'inventory' },
    { to: '/admin/kanban', icon: Kanban, label: 'production' },
    { to: '/admin/escandallo', icon: Calculator, label: 'escandallo' },
    { to: '/admin/cotizaciones', icon: Printer, label: 'quotes' },
    { to: '/admin/ventas', icon: ShoppingCart, label: 'sales' },
    { to: '/admin/consignaciones', icon: Truck, label: 'consignments' },
    { to: '/admin/proveedores', icon: Contact, label: 'suppliers' },
    { to: '/admin/ordenes', icon: FileSpreadsheet, label: 'orders' },
    { to: '/admin/gastos', icon: Receipt, label: 'expenses' },
    { to: '/admin/cashflow', icon: Wallet, label: 'cashflow' },
    { to: '/admin/liquidaciones', icon: DollarSign, label: 'royalties' },
    { to: '/admin/libros', icon: FileText, label: 'titles' },
    { to: '/admin/autores', icon: Users, label: 'authors' },
    { to: '/admin/usuarios', icon: Users, label: 'users' },
    { to: '/admin/documentos', icon: FolderOpen, label: 'documents' },
    { to: '/admin/marketing', icon: Sparkles, label: 'marketing' },
    { to: '/admin/auditoria', icon: ClipboardList, label: 'audit' },
    { to: '/admin/alertas', icon: Bell, label: 'alerts' },
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

    const hasDemoData = data?.books?.some(b => b.id.startsWith('demo_'))
    const hasBooks = data?.books?.length > 0
    const unreadAlerts = data?.alerts?.filter(a => !a.read).length || 0

    const permissions = loadPermissions()
    const userRole = user?.role || 'ADMIN'
    const allowedModules = permissions[userRole] || permissions['ADMIN']

    const moduleTranslationMap = {
        'dashboard': 'Dashboard', 'inventory': 'Inventario', 'production': 'Producción',
        'escandallo': 'Escandallo', 'quotes': 'Cotizaciones', 'sales': 'Ventas',
        'consignments': 'Consignaciones', 'suppliers': 'Proveedores', 'orders': 'Órdenes',
        'expenses': 'Gastos', 'cashflow': 'Flujo de Caja', 'royalties': 'Liquidaciones',
        'titles': 'Títulos', 'authors': 'Autores', 'users': 'Usuarios',
        'documents': 'Documentos', 'audit': 'Auditoría', 'alerts': 'Alertas', 'marketing': 'Marketing'
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
                            <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase tracking-widest">{t('admin_panel')}</p>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-slate-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {navItems
                            .filter(item => allowedModules[moduleTranslationMap[item.label]] !== false)
                            .map(item => (
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
                            ))}
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
                                    <p className="text-[10px] text-slate-500 dark:text-dark-600 font-medium">{userRole}</p>
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

                                        <div className="p-2 bg-slate-100 dark:bg-dark-50/10 space-y-2 rounded-2xl mx-2 mb-2">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-dark-500 uppercase tracking-widest px-2 mb-1">Datos Demo</p>
                                            
                                            {/* Load Examples - Visible if NO DEMO DATA exists (even if there are real books) */}
                                            {!hasDemoData && !isActionLoading && (
                                                <button
                                                    onClick={async () => {
                                                        setIsActionLoading(true)
                                                        await loadDemo()
                                                        setIsActionLoading(false)
                                                        setSettingsOpen(false)
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-primary bg-primary/5 hover:bg-primary/10 transition-all text-sm font-bold uppercase tracking-tight border border-primary/20 shadow-sm"
                                                >
                                                    <Database className="w-5 h-5" />
                                                    {t('load_demo')}
                                                </button>
                                            )}

                                            {/* Delete Examples (Clear Demo) - Visible if there are demo books */}
                                            {hasDemoData && !isActionLoading && (
                                                 <button
                                                     onClick={async () => {
                                                         if (window.confirm('¿Borrar todos los libros de ejemplo? Esto no afectará a tus libros reales.')) {
                                                             setIsActionLoading(true)
                                                             await clearDemo()
                                                             setIsActionLoading(false)
                                                             setSettingsOpen(false)
                                                         }
                                                     }}
                                                     className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 transition-all text-sm font-bold uppercase tracking-tight border border-rose-500/20 shadow-sm"
                                                 >
                                                     <Trash2 className="w-5 h-5" />
                                                     {t('clear_demo')}
                                                 </button>
                                             )}

                                            {isActionLoading && (
                                                <div className="w-full py-3 text-center text-[10px] font-bold text-slate-400 animate-pulse uppercase tracking-widest bg-slate-100/50 dark:bg-dark-300/30 rounded-xl">
                                                    Procesando...
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-2 space-y-1">
                                            <button
                                                onClick={handleReset}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all text-xs font-bold uppercase tracking-tight"
                                            >
                                                <AlertTriangle className="w-4 h-4" />
                                                {isResetting ? t('loading') : t('reset_workspace')}
                                            </button>

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
        </div>
    )
}
