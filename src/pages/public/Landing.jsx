import { Link } from 'react-router-dom'
import { BookOpen, Zap, Shield, TrendingUp, CheckCircle, ArrowRight, ChevronRight, Users, LayoutDashboard, FileText, Building2 } from 'lucide-react'

export default function Landing() {
    return (
        <div className="min-h-screen bg-dark-900 text-white selection:bg-primary/30 font-sans overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 glass-card border-b border-dark-300/50 bg-dark-900/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Editorial<span className="text-primary">Pro</span></span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <a href="#features" className="text-dark-600 hover:text-white transition-colors">Características</a>
                        <a href="#pricing" className="text-dark-600 hover:text-white transition-colors">Precios</a>
                        <Link to="/login" className="text-dark-600 hover:text-white transition-colors">Iniciar Sesión</Link>
                        <Link to="/register" className="btn-primary text-sm px-6">Empezar Gratis</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Visual elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-6 text-center z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase mb-6 slide-down">
                        <Zap className="w-3 h-3" /> El futuro de la gestión editorial
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight mb-8 slide-up">
                        Gestiona tu editorial <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-400 to-emerald-400">
                            de forma inteligente
                        </span>
                    </h1>
                    <p className="text-lg text-dark-500 max-w-2xl mx-auto mb-10 slide-up delay-100">
                        La única plataforma que unifica procesos de edición, diseño, cálculo de escandallos y liquidación de autores en un flujo de trabajo sin fisuras.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 slide-up delay-200">
                        <Link to="/register" className="btn-primary px-8 py-4 text-base w-full sm:w-auto flex items-center justify-center gap-2 group">
                            Probar 14 días gratis
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#features" className="px-8 py-4 rounded-xl font-medium text-white border border-dark-300 hover:border-dark-400 hover:bg-dark-200 transition-all w-full sm:w-auto text-center">
                            Ver características
                        </a>
                    </div>

                    {/* Dashboard Preview Mockup */}
                    <div className="mt-20 relative mx-auto max-w-5xl rounded-2xl border border-dark-300/50 glass-card shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden slide-up delay-300">
                        <div className="h-8 bg-dark-200/50 border-b border-dark-300/50 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        <div className="aspect-[16/9] bg-dark-800/80 relative flex items-center justify-center">
                            <img src="/dashboard-demo.webp" alt="Demo de vista de Dashboard" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent pointer-events-none" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4">Todo lo que tu equipo necesita</h2>
                        <p className="text-dark-600">Diseñado específicamente para las necesidades únicas de las editoriales satélites e independientes.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: LayoutDashboard, title: 'Kanban Editorial Visual', desc: 'Flujo estructurado. Sigue el progreso de recepción, corrección, diseño, hasta el envío a imprenta.' },
                            { icon: FileText, title: 'Cotizaciones Formales a Imprentas', desc: 'Genera fichas técnicas limpias y emite PDFs profesionales para solicitar cotizaciones en clics.' },
                            { icon: TrendingUp, title: 'Escandallos y Precios Reales', desc: 'Calcula tus costos por unidad tomando en cuenta tipo de papel, tiraje, comisiones y preprensa.' },
                            { icon: Zap, title: 'Liquidación de Regalías exactas', desc: 'Cruza ventas con porcentajes contractuales, liquidando a autores transparentemente en formato PDF.' },
                            { icon: Users, title: 'Freelancers y Autores Nativos', desc: 'Invita correctores o autores. Diseñamos escritorios únicos para que cada quien vea lo suyo.' },
                            { icon: Shield, title: 'Workspaces 100% Seguros', desc: 'Múltiples editoriales en aislamiento (Multi-Tenant). Tu información contable y literaria nunca se cruza.' }
                        ].map((feature, i) => (
                            <div key={i} className="glass-card p-6 hover:-translate-y-1 transition-transform duration-300">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                                    <feature.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-dark-600 text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 relative z-10 border-t border-dark-300/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4">Planes flexibles y transparentes</h2>
                        <p className="text-dark-600">Escala a tu propio ritmo. Cancela cuando quieras.</p>
                    </div>

                    <div className="max-w-md mx-auto">
                        <div className="glass-card p-8 rounded-2xl relative flex flex-col border-primary shadow-lg shadow-primary/20">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full">
                                14 días de prueba gratis
                            </div>
                            <h3 className="text-2xl font-bold mb-2 text-center text-white">Plan PRO</h3>
                            <p className="text-dark-600 text-sm mb-6 text-center">Acceso total a todas las herramientas</p>
                            <div className="mb-6 text-center">
                                <span className="text-4xl font-bold text-white">$50.000</span>
                                <span className="text-dark-600">/mes</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {[
                                    'Usuarios ilimitados',
                                    'Libros ilimitados',
                                    'Liquidación de Regalías',
                                    'Gestión de Kanban Editorial',
                                    'Solicitud automática de cotizaciones (PDF)',
                                    'Escandallos por márgenes y ventas',
                                    'Portales independientes para tus Autores'
                                ].map((f, j) => (
                                    <li key={j} className="flex items-center gap-3 text-sm text-dark-400">
                                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" /> <span className="text-white font-medium">{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link to="/register" className="w-full py-4 rounded-xl font-bold text-center transition-all btn-primary text-base">
                                Comenzar ahora
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-dark-300/30 py-12 text-center text-dark-600 text-sm relative z-10">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span className="text-lg font-bold text-white">EditorialPro</span>
                </div>
                <p>© {new Date().getFullYear()} EditorialPro SaaS. Todos los derechos reservados.</p>
            </footer>
        </div>
    )
}
