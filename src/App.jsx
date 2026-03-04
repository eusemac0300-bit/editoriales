import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import RouteGuard from './guards/RouteGuard'
import Login from './pages/Login'
import AdminLayout from './layouts/AdminLayout'
import FreelanceLayout from './layouts/FreelanceLayout'
import AuthorLayout from './layouts/AuthorLayout'
import SuperAdminLayout from './layouts/SuperAdminLayout'

// Public SaaS pages
import Landing from './pages/public/Landing'
import Register from './pages/public/Register'

// SuperAdmin pages
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'

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
import Quotes from './pages/admin/Quotes'

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
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        )
    }

    const homeUrl = user.role === 'SUPERADMIN' ? '/superadmin' : user.role === 'ADMIN' ? '/admin' : user.role === 'FREELANCE' ? '/freelance' : '/autor'

    return (
        <Routes>
            <Route path="/" element={<Navigate to={homeUrl} replace />} />
            <Route path="/login" element={<Navigate to={homeUrl} replace />} />
            <Route path="/register" element={<Navigate to={homeUrl} replace />} />

            {/* SuperAdmin routes */}
            <Route path="/superadmin" element={<RouteGuard allowedRoles={['SUPERADMIN']}><SuperAdminLayout /></RouteGuard>}>
                <Route index element={<SuperAdminDashboard />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={<RouteGuard allowedRoles={['ADMIN']}><AdminLayout /></RouteGuard>}>
                <Route index element={<AdminDashboard />} />
                <Route path="inventario" element={<Inventory />} />
                <Route path="kanban" element={<Kanban />} />
                <Route path="escandallo" element={<Escandallo />} />
                <Route path="cotizaciones" element={<Quotes />} />
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
            <Route path="*" element={<Navigate to={homeUrl} replace />} />
        </Routes>
    )
}

export default function App() {
    return <AppRoutes />
}
