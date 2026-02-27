import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RouteGuard({ children, allowedRoles }) {
    const { user } = useAuth()

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'ADMIN') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark">
                <div className="glass-card p-8 max-w-md text-center fade-in">
                    <div className="w-16 h-16 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Acceso Denegado</h2>
                    <p className="text-dark-700 mb-4">No tienes permisos para acceder a esta sección.</p>
                    <p className="text-sm text-dark-600">Tu rol: <span className="badge-red">{user.role}</span></p>
                </div>
            </div>
        )
    }

    return children
}
