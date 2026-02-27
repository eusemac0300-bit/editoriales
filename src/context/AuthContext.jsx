import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import initialData from '../data/initialData.json'
import * as db from '../lib/supabaseService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [data, setData] = useState(initialData)
    const [loading, setLoading] = useState(true)
    const [supabaseConnected, setSupabaseConnected] = useState(false)

    // Load data from Supabase on mount
    useEffect(() => {
        async function init() {
            try {
                const supabaseData = await db.loadAllData()
                if (supabaseData && supabaseData.users && supabaseData.users.length > 0) {
                    setData(supabaseData)
                    setSupabaseConnected(true)
                    console.log('✅ Connected to Supabase - data loaded')
                } else {
                    // Fallback to localStorage
                    const saved = localStorage.getItem('editorial_data')
                    if (saved) setData(JSON.parse(saved))
                    console.log('⚠️ Using localStorage fallback')
                }
            } catch (err) {
                console.error('Supabase connection failed, using localStorage:', err)
                const saved = localStorage.getItem('editorial_data')
                if (saved) setData(JSON.parse(saved))
            } finally {
                setLoading(false)
            }
        }

        const savedUser = localStorage.getItem('editorial_user')
        if (savedUser) setUser(JSON.parse(savedUser))

        init()
    }, [])

    // Save to localStorage as backup always
    useEffect(() => {
        if (!loading) {
            localStorage.setItem('editorial_data', JSON.stringify(data))
        }
    }, [data, loading])

    const login = useCallback(async (email, password) => {
        if (supabaseConnected) {
            const found = await db.loginUser(email, password)
            if (found) {
                setUser(found)
                localStorage.setItem('editorial_user', JSON.stringify(found))
                return { success: true, user: found }
            }
            return { success: false, error: 'Credenciales incorrectas' }
        }

        // Fallback to local data
        const found = data.users.find(u => u.email === email && u.password === password)
        if (found) {
            const userObj = { ...found }
            delete userObj.password
            setUser(userObj)
            localStorage.setItem('editorial_user', JSON.stringify(userObj))
            return { success: true, user: userObj }
        }
        return { success: false, error: 'Credenciales incorrectas' }
    }, [supabaseConnected, data.users])

    const logout = () => {
        setUser(null)
        localStorage.removeItem('editorial_user')
    }

    const hasPermission = (requiredRole) => {
        if (!user) return false
        if (user.role === 'ADMIN') return true
        if (requiredRole === 'FREELANCE' && (user.role === 'FREELANCE' || user.role === 'ADMIN')) return true
        if (requiredRole === 'AUTOR' && user.role === 'AUTOR') return true
        return user.role === requiredRole
    }

    const isAdmin = () => user?.role === 'ADMIN'
    const isFreelance = () => user?.role === 'FREELANCE'
    const isAutor = () => user?.role === 'AUTOR'

    const addAuditLog = useCallback(async (action, type = 'general') => {
        if (!user) return
        const entry = {
            id: `a${Date.now()}`,
            date: new Date().toISOString(),
            userId: user.id,
            userName: user.name,
            action,
            type
        }
        setData(prev => ({
            ...prev,
            auditLog: [entry, ...prev.auditLog]
        }))

        if (supabaseConnected) {
            await db.addAuditLogEntry(entry)
        }
    }, [user, supabaseConnected])

    const updateBookStatus = useCallback(async (bookId, newStatus) => {
        setData(prev => ({
            ...prev,
            books: prev.books.map(b => b.id === bookId ? { ...b, status: newStatus } : b)
        }))

        const book = data.books.find(b => b.id === bookId)
        if (book) {
            addAuditLog(`Movió '${book.title}' a ${newStatus}`, 'kanban')
        }

        if (supabaseConnected) {
            await db.updateBookStatus(bookId, newStatus)
        }
    }, [data.books, supabaseConnected, addAuditLog])

    const addComment = useCallback(async (bookId, text, category) => {
        if (!user) return
        const comment = {
            id: `c${Date.now()}`,
            bookId,
            userId: user.id,
            userName: user.name,
            role: user.role,
            text,
            date: new Date().toISOString(),
            category
        }
        setData(prev => ({
            ...prev,
            comments: [...prev.comments, comment]
        }))

        if (supabaseConnected) {
            await db.addCommentEntry(comment)
        }
    }, [user, supabaseConnected])

    const markFreelanceOnboarded = useCallback(async () => {
        if (!user || user.role !== 'FREELANCE') return
        setData(prev => ({
            ...prev,
            users: prev.users.map(u => u.id === user.id ? { ...u, firstLogin: false } : u)
        }))
        const updatedUser = { ...user, firstLogin: false }
        setUser(updatedUser)
        localStorage.setItem('editorial_user', JSON.stringify(updatedUser))

        if (supabaseConnected) {
            await db.updateUserFirstLogin(user.id)
        }
    }, [user, supabaseConnected])

    // ============ SYNC: ADD BOOK ============
    const addNewBook = useCallback(async (book) => {
        setData(prev => ({ ...prev, books: [...prev.books, book] }))
        if (supabaseConnected) {
            await db.addBook(book)
        }
    }, [supabaseConnected])

    // ============ SYNC: INVENTORY ============
    const updateInventory = useCallback(async (bookId, updater) => {
        let updatedPhysical = null
        setData(prev => {
            const physical = [...prev.inventory.physical]
            const idx = physical.findIndex(p => p.bookId === bookId)
            if (idx >= 0) {
                physical[idx] = updater(physical[idx])
            } else {
                physical.push(updater(null, bookId))
            }
            updatedPhysical = physical.find(p => p.bookId === bookId)
            return { ...prev, inventory: { ...prev.inventory, physical } }
        })
        if (supabaseConnected && updatedPhysical) {
            await db.upsertInventoryPhysical(bookId, updatedPhysical)
        }
    }, [supabaseConnected])

    // ============ SYNC: APPROVE ROYALTY ============
    const approveRoyalty = useCallback(async (royaltyId) => {
        setData(prev => ({
            ...prev,
            finances: { ...prev.finances, royalties: prev.finances.royalties.map(r => r.id === royaltyId ? { ...r, status: 'aprobada' } : r) }
        }))
        if (supabaseConnected) {
            await db.updateRoyaltyStatus(royaltyId, 'aprobada')
        }
    }, [supabaseConnected])

    // ============ SYNC: ALERTS ============
    const markAlertAsRead = useCallback(async (alertId) => {
        setData(prev => ({
            ...prev,
            alerts: prev.alerts.map(a => a.id === alertId ? { ...a, read: true } : a)
        }))
        if (supabaseConnected) {
            await db.markAlertRead(alertId)
        }
    }, [supabaseConnected])

    const markAllAlerts = useCallback(async () => {
        setData(prev => ({
            ...prev,
            alerts: prev.alerts.map(a => ({ ...a, read: true }))
        }))
        if (supabaseConnected) {
            await db.markAllAlertsRead()
        }
    }, [supabaseConnected])

    // ============ SYNC: USER PROFILE ============
    const updateProfile = useCallback(async (userId, updates) => {
        setData(prev => ({
            ...prev,
            users: prev.users.map(u => u.id === userId ? { ...u, ...updates } : u)
        }))
        if (supabaseConnected) {
            await db.updateUserProfile(userId, updates)
        }
    }, [supabaseConnected])

    const formatCLP = (amount) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const value = {
        user, data, setData, login, logout, hasPermission,
        isAdmin, isFreelance, isAutor,
        addAuditLog, updateBookStatus, addComment,
        markFreelanceOnboarded, formatCLP,
        addNewBook, updateInventory, approveRoyalty,
        markAlertAsRead, markAllAlerts, updateProfile,
        loading, supabaseConnected
    }

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#e2e8f0',
                fontFamily: 'Inter, system-ui, sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        border: '3px solid rgba(99, 102, 241, 0.3)',
                        borderTopColor: '#6366f1',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }} />
                    <p style={{ fontSize: 18, fontWeight: 500 }}>Conectando con la base de datos...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        )
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
