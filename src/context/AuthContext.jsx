import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import initialData from '../data/initialData.json'
import * as db from '../lib/supabaseService'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [data, setData] = useState(initialData)
    const [loading, setLoading] = useState(true)
    const [supabaseConnected, setSupabaseConnected] = useState(false)
    const reloadTimerRef = useRef(null)
    const lastLocalChangeRef = useRef(0)

    // Reload all data from Supabase
    const reloadData = useCallback(async () => {
        if (!user?.tenantId) return
        try {
            const supabaseData = await db.loadAllData(user.tenantId)
            if (supabaseData && supabaseData.users && supabaseData.users.length > 0) {
                setData(supabaseData)
                console.log('🔄 Realtime: data refreshed for tenant', user.tenantId)
            }
        } catch (err) {
            console.error('Realtime reload failed:', err)
        }
    }, [user?.tenantId])

    // Debounced reload to avoid flooding
    const scheduleReload = useCallback(() => {
        // Skip if change was triggered locally (within last 2 seconds)
        if (Date.now() - lastLocalChangeRef.current < 2000) return

        if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current)
        reloadTimerRef.current = setTimeout(() => {
            reloadData()
        }, 500)
    }, [reloadData])

    // Load data from Supabase on mount ONLY if already logged in
    useEffect(() => {
        async function init(savedUser) {
            if (!savedUser?.tenantId) {
                setLoading(false)
                return
            }
            try {
                const supabaseData = await db.loadAllData(savedUser.tenantId)
                if (supabaseData && supabaseData.users && supabaseData.users.length > 0) {
                    setData(supabaseData)
                    setSupabaseConnected(true)
                    console.log(`✅ Connected to Supabase - loaded data for tenant: ${savedUser.tenantId}`)
                } else {
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

        const savedUserRecord = localStorage.getItem('editorial_user')
        if (savedUserRecord) {
            const parsed = JSON.parse(savedUserRecord)
            setUser(parsed)
            init(parsed)
        } else {
            setLoading(false)
        }
    }, [])

    // Subscribe to Supabase Realtime changes + Polling fallback
    useEffect(() => {
        if (!supabaseConnected) return

        // Realtime subscription
        const channel = supabase
            .channel('editorial-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, (payload) => {
                console.log('📡 Realtime: books changed', payload.eventType)
                scheduleReload()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, (payload) => {
                console.log('📡 Realtime: comments changed', payload.eventType)
                scheduleReload()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_log' }, () => scheduleReload())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => scheduleReload())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_physical' }, () => scheduleReload())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'royalties' }, () => scheduleReload())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => scheduleReload())
            .subscribe((status) => {
                console.log('📡 Realtime status:', status)
            })

        // Polling fallback: reload every 15 seconds to catch any missed changes
        const pollInterval = setInterval(() => {
            if (Date.now() - lastLocalChangeRef.current > 3000) {
                reloadData()
            }
        }, 15000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(pollInterval)
        }
    }, [supabaseConnected, scheduleReload, reloadData])

    // Save to localStorage as backup always
    useEffect(() => {
        if (!loading) {
            localStorage.setItem('editorial_data', JSON.stringify(data))
        }
    }, [data, loading])

    const login = useCallback(async (email, password) => {
        // Asumimos que Supabase siempre intentará conectarse. Si no, tenemos fallback local.
        const found = await db.loginUser(email, password)
        if (found && found.tenantId) {
            setUser(found)
            localStorage.setItem('editorial_user', JSON.stringify(found))

            // Cargar datos INMEDIATAMENTE de esta editorial al hacer login
            const tenantData = await db.loadAllData(found.tenantId)
            if (tenantData) {
                setData(tenantData)
                setSupabaseConnected(true)
            }
            return { success: true, user: found }
        }

        // Fallback to local data (solo para demos offline)
        const foundLocal = data.users.find(u => u.email === email && u.password === password)
        if (foundLocal) {
            const userObj = { ...foundLocal }
            delete userObj.password
            setUser(userObj)
            localStorage.setItem('editorial_user', JSON.stringify(userObj))
            return { success: true, user: userObj }
        }
        return { success: false, error: 'Credenciales incorrectas' }
    }, [data.users])

    const logout = () => {
        setUser(null)
        setData(initialData) // Limpiar datos de memoria por seguridad cross-tenant
        localStorage.removeItem('editorial_user')
        localStorage.removeItem('editorial_data')
    }

    const hasPermission = (requiredRole) => {
        if (!user) return false
        if (requiredRole === 'SUPERADMIN') return user.role === 'SUPERADMIN'
        if (user.role === 'SUPERADMIN') return true
        if (user.role === 'ADMIN') return true
        if (requiredRole === 'FREELANCE' && (user.role === 'FREELANCE' || user.role === 'ADMIN')) return true
        if (requiredRole === 'AUTOR' && user.role === 'AUTOR') return true
        return user.role === requiredRole
    }

    const isSuperAdmin = () => user?.role === 'SUPERADMIN'
    const isAdmin = () => user?.role === 'ADMIN'
    const isFreelance = () => user?.role === 'FREELANCE'
    const isAutor = () => user?.role === 'AUTOR'

    const addAuditLog = useCallback(async (action, type = 'general') => {
        lastLocalChangeRef.current = Date.now()
        if (!user) return
        const entry = {
            id: `a${Date.now()}`,
            tenantId: user.tenantId, // Multi-tenant isolation
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
        lastLocalChangeRef.current = Date.now()
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
        lastLocalChangeRef.current = Date.now()
        if (!user) return
        const comment = {
            id: `c${Date.now()}`,
            tenantId: user.tenantId,
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
    const addNewBook = useCallback(async (bookData) => {
        lastLocalChangeRef.current = Date.now()
        const book = { ...bookData, tenantId: user?.tenantId }
        setData(prev => ({ ...prev, books: [...prev.books, book] }))
        if (supabaseConnected) {
            await db.addBook(book)
        }
    }, [user, supabaseConnected])

    // ============ SYNC: UPDATE BOOK DETAILS ============
    const updateBookDetails = useCallback(async (bookId, updates) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({
            ...prev,
            books: prev.books.map(b => b.id === bookId ? { ...b, ...updates } : b)
        }))
        if (supabaseConnected) {
            await db.updateBook(bookId, updates)
        }
    }, [supabaseConnected])

    // ============ SYNC: INVENTORY ============
    const updateInventory = useCallback(async (bookId, updater) => {
        lastLocalChangeRef.current = Date.now()
        let updatedPhysical = null
        setData(prev => {
            const physical = [...prev.inventory.physical]
            const idx = physical.findIndex(p => p.bookId === bookId)
            if (idx >= 0) {
                physical[idx] = updater(physical[idx])
            } else {
                const newInv = updater(null, bookId)
                newInv.tenantId = user?.tenantId
                physical.push(newInv)
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
        lastLocalChangeRef.current = Date.now()
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
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({
            ...prev,
            alerts: prev.alerts.map(a => a.id === alertId ? { ...a, read: true } : a)
        }))
        if (supabaseConnected) {
            await db.markAlertRead(alertId)
        }
    }, [supabaseConnected])

    const markAllAlerts = useCallback(async () => {
        lastLocalChangeRef.current = Date.now()
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
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({
            ...prev,
            users: prev.users.map(u => u.id === userId ? { ...u, ...updates } : u)
        }))
        if (supabaseConnected) {
            await db.updateUserProfile(userId, updates)
        }
    }, [supabaseConnected])

    // ============ SYNC: USER MANAGEMENT (ADMIN ONLY) ============
    const addNewUser = useCallback(async (userData) => {
        lastLocalChangeRef.current = Date.now()
        const newUser = {
            id: `u${Date.now()}`,
            tenantId: user?.tenantId,
            ...userData,
            avatar: userData.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
            firstLogin: userData.role === 'FREELANCE',
            socialLinks: {},
            bio: null
        }
        setData(prev => ({ ...prev, users: [...prev.users, newUser] }))
        if (supabaseConnected) {
            await db.addUser(newUser)
        }
        return newUser
    }, [user, supabaseConnected])

    const updateExistingUser = useCallback(async (userId, updates) => {
        lastLocalChangeRef.current = Date.now()
        if (updates.name) {
            updates.avatar = updates.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        }
        setData(prev => ({
            ...prev,
            users: prev.users.map(u => u.id === userId ? { ...u, ...updates } : u)
        }))
        if (supabaseConnected) {
            await db.updateUser(userId, updates)
        }
    }, [supabaseConnected])

    const deleteExistingUser = useCallback(async (userId) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({
            ...prev,
            users: prev.users.filter(u => u.id !== userId),
            comments: prev.comments.filter(c => c.userId !== userId),
            auditLog: prev.auditLog.filter(a => a.userId !== userId)
        }))
        if (supabaseConnected) {
            await db.deleteUser(userId)
        }
    }, [supabaseConnected])

    const resetWorkspace = useCallback(async () => {
        if (!user || user.role !== 'ADMIN') return false
        setLoading(true)
        try {
            const success = await db.resetTenantData(user.tenantId, user.id)
            if (success) {
                // Keep only the current logged in admin user
                setData({
                    ...initialData,
                    users: [user],
                    books: [],
                    inventory: { physical: [], digital: [] },
                    finances: { invoices: [], royalties: [] },
                    auditLog: [],
                    comments: [],
                    alerts: []
                })
                // Trigger a hard reload from db just to be sure
                await reloadData()
            }
            return success
        } finally {
            setLoading(false)
        }
    }, [user, reloadData])

    const formatCLP = (amount) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const value = {
        user, data, setData, login, logout, hasPermission,
        isSuperAdmin, isAdmin, isFreelance, isAutor, resetWorkspace,
        addAuditLog, updateBookStatus, addComment,
        markFreelanceOnboarded, formatCLP,
        addNewBook, updateBookDetails, updateInventory, approveRoyalty,
        markAlertAsRead, markAllAlerts, updateProfile,
        addNewUser, updateExistingUser, deleteExistingUser,
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
