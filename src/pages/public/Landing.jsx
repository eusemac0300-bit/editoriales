import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Zap, Shield, TrendingUp, CheckCircle, ArrowRight, Users, LayoutDashboard, FileText, Clock, DollarSign, AlertTriangle, Calculator, BarChart3, Building2 } from 'lucide-react'
import { getGlobalEmail } from '../../lib/supabaseService'

export default function Landing() {
    const handleDemoRequest = (e) => {
        e.preventDefault()
        window.location.href = '/validar-editorial'
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark text-slate-900 dark:text-slate-100 selection:bg-primary/30 font-sans overflow-x-hidden transition-colors duration-300">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 glass-card border-b border-slate-200 dark:border-dark-300/50 bg-white/80 dark:bg-dark/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Editorial<span className="text-primary">Pro</span></span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <a href="#problema" className="text-slate-600 dark:text-dark-500 hover:text-primary dark:hover:text-white transition-colors">Por qué elegirnos</a>
                        <a href="#features" className="text-slate-600 dark:text-dark-500 hover:text-primary dark:hover:text-white transition-colors">Soluciones</a>
                        <a href="#pricing" className="text-slate-600 dark:text-dark-500 hover:text-primary dark:hover:text-white transition-colors">Precios</a>
                        <Link to="/login" className="text-slate-600 dark:text-dark-500 hover:text-primary dark:hover:text-white transition-colors">Iniciar Sesión</Link>
                        <button onClick={handleDemoRequest} className="btn-primary text-sm px-6 font-medium">Comenzar Ahora</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-6 text-center z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wide uppercase mb-6 slide-down">
                        <Zap className="w-4 h-4" /> El software definitivo para editoriales
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight mb-8 slide-up">
                        El fin del desorden y <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-500 to-emerald-500">
                            las planillas de cálculo interminables
                        </span>
                    </h1>
                    <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 slide-up delay-100 leading-relaxed font-medium">
                        Diseñado exclusivamente para editoriales. Centraliza tus cotizaciones, automatiza el cálculo de liquidaciones y toma el control total de tus fugas de tiempo y dinero.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 slide-up delay-200">
                        <button onClick={handleDemoRequest} className="btn-primary px-8 py-4 text-base w-full sm:w-auto flex items-center justify-center gap-2 group shadow-xl shadow-primary/30 font-medium">
                            Comenzar Mi Onboarding
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <a href="#demo" className="px-8 py-4 rounded-xl font-medium text-slate-700 dark:text-white border border-slate-300 dark:border-dark-300 hover:border-primary hover:text-primary dark:hover:border-dark-400 dark:hover:bg-dark-200 transition-all w-full sm:w-auto text-center bg-white dark:bg-transparent">
                            Ver el sistema en acción
                        </a>
                    </div>
                </div>
            </section>

            {/* Pain Points / Problem Section */}
            <section id="problema" className="py-20 relative z-10 bg-slate-100/50 dark:bg-dark-800/50 border-y border-slate-200 dark:border-dark-300/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-slate-900 dark:text-white">¿Sabías que tu editorial pierde más del de <span className="text-red-500">40% del tiempo</span> en tareas manuales?</h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
                                La principal causa de pérdida de rentabilidad en las editoriales independientes es la fragmentación. Documentos perdidos, escandallos mal calculados y regalías que toman semanas en procesarse.
                            </p>

                            <div className="space-y-6">
                                <div className="flex gap-4 items-start">
                                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-6 h-6 text-red-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-1 text-slate-800 dark:text-white">Fugas de Dinero Ocultas</h4>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm">Escandallos hechos "al ojo" que no contemplan todos los costos reales (pre-prensa, envíos, comisiones).</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                                        <Clock className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-1 text-slate-800 dark:text-white">El Infierno de las Liquidaciones</h4>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm">Cruzar las ventas con los % de contrato de cada autor manualmente toma horas. Nosotros lo hacemos en milisegundos.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                        <FileText className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-1 text-slate-800 dark:text-white">Cotizaciones Desordenadas</h4>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm">Cruce interminable de correos con imprentas sin un seguimiento formal. Sin control de O.C ni fechas pactadas.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Stats Visual */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-emerald-500/20 rounded-3xl blur-2xl transform rotate-3" />
                            <div className="bg-white dark:bg-dark-200 border border-slate-200 dark:border-dark-300 p-8 rounded-3xl relative shadow-2xl">
                                <h3 className="text-center font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest text-sm mb-8">Tiempo invertido al mes (Promedio)</h3>

                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-sm font-semibold mb-2">
                                            <span className="text-red-600 dark:text-red-400">Con Planillas y Correo</span>
                                            <span className="text-red-600 dark:text-red-400">60 Horas perdidas</span>
                                        </div>
                                        <div className="h-4 rounded-full bg-slate-100 dark:bg-dark-300 overflow-hidden">
                                            <div className="h-full bg-red-500 w-[85%] rounded-full relative">
                                                <div className="absolute inset-0 bg-white/20 progress-stripe pattern"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <div className="flex justify-between text-sm font-semibold mb-2">
                                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Usando EditorialPro</span>
                                            <span className="text-emerald-600 dark:text-emerald-400">Reducido a Segundos</span>
                                        </div>
                                        <div className="h-4 rounded-full bg-slate-100 dark:bg-dark-300 overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[15%] rounded-full relative shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-dark-300 text-center">
                                    <p className="text-slate-900 dark:text-white font-bold text-lg">Convierte ese tiempo en vender más libros.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dashboard / Demo View */}
            <section id="demo" className="py-24 relative z-10 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Tu nueva oficina, <span className="text-primary">100% digital</span></h2>
                    <p className="text-slate-600 dark:text-slate-300 text-lg mb-12 max-w-2xl mx-auto">No es una plantilla de Notion. Es un software de alto rendimiento con reportes reales, tableros Kanban interactivos y flujos de trabajo pre-configurados para editoriales reales.</p>

                    <div className="relative mx-auto w-full max-w-5xl">
                        {/* Decorative floating badges */}
                        <div className="absolute -left-12 top-1/4 bg-white dark:bg-dark-200 p-4 rounded-xl shadow-xl border border-slate-200 dark:border-dark-300 z-20 slide-in-right hidden lg:flex items-center gap-3">
                            <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-500"><DollarSign className="w-6 h-6" /></div>
                            <div className="text-left">
                                <p className="text-[10px] text-slate-500 dark:text-slate-300 uppercase font-bold">Liquidación Autores</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">Automatizada ✅</p>
                            </div>
                        </div>

                        <div className="absolute -right-12 bottom-1/4 bg-white dark:bg-dark-200 p-4 rounded-xl shadow-xl border border-slate-200 dark:border-dark-300 z-20 slide-up hidden lg:flex items-center gap-3">
                            <div className="bg-primary/20 p-2 rounded-lg text-primary"><BarChart3 className="w-6 h-6" /></div>
                            <div className="text-left">
                                <p className="text-[10px] text-slate-500 dark:text-slate-300 uppercase font-bold">Control de Stock</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">En tiempo real 📦</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-300 dark:border-dark-400 glass-card shadow-2xl overflow-hidden relative z-10">
                            <div className="h-10 bg-slate-200 dark:bg-dark-300 border-b border-slate-300 dark:border-dark-400 flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <div className="aspect-[16/10] bg-slate-100 dark:bg-dark-800 relative flex items-center justify-center">
                                {/* Use a beautiful fallback if img doesn't exist, we just simulate the UX here */}
                                <div className="absolute inset-0 w-full h-full bg-slate-50 dark:bg-dark border-t border-slate-200 dark:border-dark-700 flex text-left overflow-hidden">
                                    {/* Sidebar Mockup */}
                                    <div className="w-1/4 h-full bg-white dark:bg-dark-800 border-r border-slate-200 dark:border-dark-700 p-4 hidden sm:flex flex-col gap-3">
                                        <div className="w-full h-8 bg-slate-100 dark:bg-dark-700 rounded-lg mb-4" />
                                        <div className="w-3/4 h-4 bg-slate-100 dark:bg-dark-700 rounded-md" />
                                        <div className="w-1/2 h-4 bg-slate-100 dark:bg-dark-700 rounded-md" />
                                        <div className="w-2/3 h-4 bg-slate-100 dark:bg-dark-700 rounded-md" />
                                        <div className="w-full h-4 bg-primary/10 rounded-md border border-primary/20 mt-2" />
                                    </div>

                                    {/* Main Content Mockup */}
                                    <div className="flex-1 h-full p-6 flex flex-col gap-6 relative">
                                        {/* Top Stats */}
                                        <div className="flex gap-4 h-24">
                                            <div className="flex-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl p-4 shadow-sm flex flex-col justify-center">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-3 animate-pulse"><DollarSign className="w-5 h-5" /></div>
                                                <div className="w-1/2 h-3 bg-slate-200 dark:bg-dark-600 rounded-full mb-2" />
                                                <div className="w-3/4 h-5 bg-slate-300 dark:bg-dark-500 rounded-full" />
                                            </div>
                                            <div className="flex-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl p-4 shadow-sm flex flex-col justify-center">
                                                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center mb-3 pulse-glow"><LayoutDashboard className="w-5 h-5" /></div>
                                                <div className="w-1/2 h-3 bg-slate-200 dark:bg-dark-600 rounded-full mb-2" />
                                                <div className="w-2/3 h-5 bg-slate-300 dark:bg-dark-500 rounded-full" />
                                            </div>
                                        </div>

                                        {/* Kanban Board Mockup */}
                                        <div className="flex-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl p-4 flex gap-3 overflow-hidden relative">
                                            {/* Column 1 */}
                                            <div className="flex-1 bg-slate-50 dark:bg-dark/50 rounded-lg p-3 border border-slate-100 dark:border-dark-700 flex flex-col gap-3">
                                                <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> 1. Recepción</div>
                                                <div className="w-full h-16 sm:h-20 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-600 rounded-lg shadow-sm p-3">
                                                    <div className="w-3/4 h-2 bg-slate-300 dark:bg-dark-500 rounded-full mb-3" />
                                                    <div className="w-1/2 h-2 bg-slate-200 dark:bg-dark-600 rounded-full" />
                                                </div>
                                            </div>
                                            {/* Column 2 */}
                                            <div className="flex-1 bg-slate-50 dark:bg-dark/50 rounded-lg p-3 border border-slate-100 dark:border-dark-700 flex flex-col gap-3">
                                                <div className="text-[9px] sm:text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 2. Corrección</div>
                                                <div className="w-full h-16 sm:h-20 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-600 rounded-lg shadow-sm p-3 opacity-50">
                                                    <div className="w-full h-2 bg-slate-300 dark:bg-dark-500 rounded-full mb-3" />
                                                    <div className="w-1/3 h-2 bg-slate-200 dark:bg-dark-600 rounded-full" />
                                                </div>
                                            </div>
                                            {/* Column 3 */}
                                            <div className="flex-1 bg-slate-50 dark:bg-dark/50 rounded-lg p-3 border border-slate-100 dark:border-dark-700 flex flex-col gap-3 hidden sm:flex">
                                                <div className="text-[9px] sm:text-[10px] font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> 3. Diseño</div>
                                            </div>
                                            {/* Column 4 */}
                                            <div className="flex-1 bg-slate-50 dark:bg-dark/50 rounded-lg p-3 border border-slate-100 dark:border-dark-700 flex flex-col gap-3 hidden md:flex">
                                                <div className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 4. Imprenta</div>
                                            </div>

                                            {/* The Animated Card */}
                                            <div className="absolute top-[4.5rem] w-full max-w-[calc(50%-1.1rem)] sm:max-w-[calc(33.33%-1.2rem)] md:max-w-[calc(25%-1rem)] bg-white dark:bg-dark-700 border-2 border-primary rounded-lg shadow-xl p-3 z-10 animate-mock-card flex flex-col justify-center">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-white leading-tight">Mss. "El Arte de..."</span>
                                                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0"><CheckCircle className="w-3 h-3 text-emerald-500" /></div>
                                                    <div className="h-1.5 flex-1 bg-primary/20 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary animate-pulse w-2/3"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 relative z-10 bg-slate-100/50 dark:bg-dark-50/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4">Soluciones diseñadas para la gestión global</h2>
                        <p className="text-slate-600 dark:text-slate-300">Toma mejores decisiones comerciales y agiliza toda la operativa diaria de tu editorial.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Calculator, title: 'Escandallos (Costos) y Rentabilidad', desc: 'Calcula cuánto te cuesta exactamente producir libros, ebooks o audiolibros. Incluye todos los costos ocultos. Conoce tu margen real.' },
                            { icon: FileText, title: 'Cotizaciones Formales a Imprentas', desc: 'Genera fichas técnicas unificadas y emite PDFs con Órdenes de Compra automáticas. Nunca más una especificación perdida por correo.' },
                            { icon: Zap, title: 'Generación Automática de Regalías', desc: 'Cruza ventas en firme con porcentajes contractuales en un clic. Genera el PDF detallado para tus autores sin tocar planillas de cálculo.' },
                            { icon: LayoutDashboard, title: 'Sincronización de Stock y Pedidos', desc: 'Tu catálogo siempre al día. El inventario se actualiza automáticamente con cada ingreso de imprenta o venta realizada.' },
                            { icon: Building2, title: 'En Firme y en Depósito (Consignaciones)', desc: 'Despacha libros a librerías, controla las liquidaciones y emite Albaranes/Guías de despacho con exactitud de cirujano.' },
                            { icon: Users, title: 'Portales de Autores y Staff', desc: 'Tus autores pueden acceder para ver sus liquidaciones y ventas en vivo. Transparencia que fideliza talentos a tu editorial.' }
                        ].map((feature, i) => (
                            <div key={i} className="glass-card bg-white dark:bg-dark-200 border-slate-200 dark:border-dark-300 p-8 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group">
                                <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-dark-300 border border-slate-200 dark:border-dark-400 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300 text-primary">
                                    <feature.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">{feature.title}</h3>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 relative z-10 border-t border-slate-200 dark:border-dark-300/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl font-bold mb-4">¿Listo para transformar tu editorial?</h2>
                        <p className="text-slate-600 dark:text-slate-300 text-lg">Pruébalo un mes entero sin compromisos. Te aseguramos que no querrás volver a las viejas planillas de cálculo.</p>
                    </div>

                    <div className="max-w-md mx-auto">
                        <div className="glass-card bg-white dark:bg-dark-200 p-8 pt-12 rounded-3xl relative flex flex-col border-2 border-primary shadow-2xl shadow-primary/20 transform hover:scale-105 transition-transform duration-300">
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-emerald-500 text-white text-sm font-bold uppercase tracking-widest py-2 px-6 rounded-full shadow-lg">
                                Agenda una Demo
                            </div>
                            <h3 className="text-3xl font-black mb-2 text-center text-slate-900 dark:text-white">Plan Full Access</h3>
                            <p className="text-slate-500 dark:text-slate-300 text-sm mb-6 text-center">Software sin limitaciones para editores serios.</p>
                            <div className="mb-6 text-center">
                                <span className="text-5xl font-black text-slate-900 dark:text-white">US$99</span>
                                <span className="text-slate-500 dark:text-slate-300 font-bold ml-1">/mes</span>
                            </div>

                            <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 mb-5">
                                <p className="text-xs text-center text-primary-600 dark:text-primary-300 font-bold flex flex-col gap-1 items-center">
                                    <Shield className="w-5 h-5" />
                                    Pruébalo ahora. Una interfaz poderosa, sumamente intuitiva y muy fácil de usar para cualquier editorial. Sin complicaciones tecnológicas, para que te dediques sólo a hacer libros.
                                </p>
                            </div>

                            <ul className="space-y-3.5 mb-8 flex-1 border-t border-slate-100 dark:border-dark-300 pt-6">
                                {[
                                    'Usuarios ilimitados (Multi-Tenant)',
                                    'Catálogo de libros y Control de Stock unificado',
                                    'Simulador preciso de Escandallos (Costos)',
                                    'Liquidaciones automáticas y Portal de Autores',
                                    'Emisión de Cotizaciones y Órdenes a Imprentas',
                                    'Gestión inteligente de Consignaciones y Depósitos',
                                    'Módulo avanzado de Proveedores',
                                    'Exportación nativa de Albaranes, Guías y PDFs'
                                ].map((f, j) => (
                                    <li key={j} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> <span className="font-semibold">{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <button onClick={handleDemoRequest} className="w-full inline-block py-5 rounded-xl font-bold text-center transition-all btn-primary text-lg shadow-xl shadow-primary/25">
                                Iniciar Solicitud de Cierre
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-dark-300/30 py-12 text-center text-slate-500 dark:text-slate-400 text-sm relative z-10 bg-white dark:bg-dark">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <BookOpen className="w-6 h-6 text-primary" />
                    <span className="text-xl font-bold text-slate-800 dark:text-white">EditorialPro</span>
                </div>
                <p className="mb-2">El motor financiero y operativo para la nueva generación de editoriales.</p>
                <p>© {new Date().getFullYear()} EditorialPro. Todos los derechos reservados. <span className="text-slate-500 font-medium">v3.1.5.6 (AutoBook Pro)</span></p>
            </footer>
        </div>
    )
}
