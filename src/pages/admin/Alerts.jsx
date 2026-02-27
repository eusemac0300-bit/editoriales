import { useAuth } from '../../context/AuthContext'
import { Bell, AlertTriangle, Package, FileText, DollarSign, Check } from 'lucide-react'

export default function Alerts() {
    const { data, setData } = useAuth()

    const markRead = (id) => {
        setData(prev => ({
            ...prev,
            alerts: prev.alerts.map(a => a.id === id ? { ...a, read: true } : a)
        }))
    }

    const markAllRead = () => {
        setData(prev => ({
            ...prev,
            alerts: prev.alerts.map(a => ({ ...a, read: true }))
        }))
    }

    const iconMap = {
        stock_critico: <Package className="w-5 h-5 text-red-400" />,
        contrato_vencimiento: <FileText className="w-5 h-5 text-amber-400" />,
        liquidacion_pendiente: <DollarSign className="w-5 h-5 text-primary-300" />,
    }
    const colorMap = {
        stock_critico: 'border-l-red-500 bg-red-500/5',
        contrato_vencimiento: 'border-l-amber-500 bg-amber-500/5',
        liquidacion_pendiente: 'border-l-primary bg-primary/5',
    }
    const labelMap = {
        stock_critico: 'Stock Crítico',
        contrato_vencimiento: 'Vencimiento Contrato',
        liquidacion_pendiente: 'Liquidación Pendiente',
    }

    const unread = data.alerts.filter(a => !a.read)

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Bell className="w-6 h-6 text-primary" />Alertas y Notificaciones
                    </h1>
                    <p className="text-dark-600 text-sm mt-1">{unread.length} alertas sin leer</p>
                </div>
                {unread.length > 0 && (
                    <button onClick={markAllRead} className="btn-secondary text-sm">
                        <Check className="w-4 h-4 inline mr-1" /> Marcar todas como leídas
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {data.alerts.map(alert => (
                    <div key={alert.id} className={`glass-card p-4 border-l-4 ${colorMap[alert.type]} ${alert.read ? 'opacity-60' : ''} transition-all`}>
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-dark-200 flex items-center justify-center shrink-0">
                                {iconMap[alert.type] || <AlertTriangle className="w-5 h-5 text-dark-600" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium uppercase ${alert.type === 'stock_critico' ? 'text-red-400' : alert.type === 'contrato_vencimiento' ? 'text-amber-400' : 'text-primary-300'}`}>
                                        {labelMap[alert.type]}
                                    </span>
                                    {!alert.read && <span className="w-2 h-2 bg-red-500 rounded-full pulse-glow" />}
                                </div>
                                <p className="text-sm text-white mt-1">{alert.message}</p>
                                <p className="text-xs text-dark-500 mt-1">{new Date(alert.date).toLocaleDateString('es-CL')}</p>
                            </div>
                            {!alert.read && (
                                <button onClick={() => markRead(alert.id)} className="text-xs text-dark-600 hover:text-white transition-colors">
                                    Leída
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
