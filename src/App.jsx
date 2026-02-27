import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import RouteGuard from './guards/RouteGuard'
import Login from './pages/Login'
import AdminLayout from './layouts/AdminLayout'
import FreelanceLayout from './layouts/FreelanceLayout'
import AuthorLayout from './layouts/AuthorLayout'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import Kanban from './pages/admin/Kanban'
import Inventory from './pages/admin/Inventory'
import Escandallo from './pages/admin/Escandallo'
import Royalties from './pages/admin/Royalties'
import AuditLog from './pages/admin/AuditLog'
import Alerts from './pages/admin/Alerts'
import Books from './pages/admin/Books'
import Documents from './pages/admin/Documents'
import UsersPage from './pages/admin/Users'
import Reports from './pages/admin/Reports'

// Freelance pages
import FreelanceKanban from './pages/freelance/FreelanceKanban'

// Author pages
import AuthorDashboard from './pages/author/AuthorDashboard'
import Profile from './pages/author/Profile'
import PaymentHistory from './pages/author/PaymentHistory'

function AppRoutes() {
    const { user } = useAuth()

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        )
    }

    return (
        <Routes>
            <Route path="/login" element={<Navigate to={user.role === 'ADMIN' ? '/admin' : user.role === 'FREELANCE' ? '/freelance' : '/autor'} replace />} />

            {/* Admin routes */}
            <Route path="/admin" element={<RouteGuard allowedRoles={['ADMIN']}><AdminLayout /></RouteGuard>}>
                <Route index element={<AdminDashboard />} />
                <Route path="inventario" element={<Inventory />} />
                <Route path="kanban" element={<Kanban />} />
                <Route path="escandallo" element={<Escandallo />} />
                <Route path="liquidaciones" element={<Royalties />} />
                <Route path="libros" element={<Books />} />
                <Route path="documentos" element={<Documents />} />
                <Route path="usuarios" element={<UsersPage />} />
                <Route path="auditoria" element={<AuditLog />} />
                <Route path="alertas" element={<Alerts />} />
                <Route path="reportes" element={<Reports />} />
            </Route>

            {/* Freelance routes */}
            <Route path="/freelance" element={<RouteGuard allowedRoles={['FREELANCE']}><FreelanceLayout /></RouteGuard>}>
                <Route index element={<FreelanceKanban />} />
            </Route>

            {/* Author routes */}
            <Route path="/autor" element={<RouteGuard allowedRoles={['AUTOR']}><AuthorLayout /></RouteGuard>}>
                <Route index element={<AuthorDashboard />} />
                <Route path="perfil" element={<Profile />} />
                <Route path="pagos" element={<PaymentHistory />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to={user.role === 'ADMIN' ? '/admin' : user.role === 'FREELANCE' ? '/freelance' : '/autor'} replace />} />
        </Routes>
    )
}

export default function App() {
    return <AppRoutes />
}
