import React from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Critical Render Error caught by GlobalErrorBoundary:", error, errorInfo);
    }

    handleReset = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
                    <div className="max-w-md w-full glass-card p-8 border border-red-500/20 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">¡Ups! Algo salió mal</h1>
                        <p className="text-slate-400 mb-6 text-sm">
                            La aplicación encontró un error inesperado al intentar mostrar esta pantalla. 
                            Esto puede deberse a datos inconsistentes en tu sesión.
                        </p>
                        
                        <div className="bg-black/20 rounded-lg p-3 mb-6 text-left overflow-hidden">
                            <p className="text-[10px] font-mono text-red-400 truncate">
                                {this.state.error?.toString()}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <button 
                                onClick={() => window.location.reload()}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" /> Reintentar
                            </button>
                            <button 
                                onClick={this.handleReset}
                                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-all rounded-lg hover:bg-white/5 flex items-center justify-center gap-2"
                            >
                                <Home className="w-4 h-4" /> Cerrar sesión y limpiar datos
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
