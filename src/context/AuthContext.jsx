import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import * as db from '../lib/supabaseService'
import { supabase } from '../lib/supabase'
import { translations } from '../lib/translations'

const AuthContext = createContext(null)

const initialData = {
    users: [],
    books: [],
    inventory: { physical: [], digital: [] },
    finances: { invoices: [], royalties: [], sales: [], consignments: [], expenses: [] },
    auditLog: [],
    comments: [],
    alerts: [],
    documents: [],
    quotes: [],
    suppliers: [],
    purchaseOrders: []
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [data, setData] = useState(initialData)
    const [loading, setLoading] = useState(true)
    const [supabaseConnected, setSupabaseConnected] = useState(false)
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
    const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'es')
    const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'CLP')
    const [taxRate, setTaxRate] = useState(() => parseFloat(localStorage.getItem('taxRate') || '0.19'))
    const reloadTimerRef = useRef(null)
    // Reference to track if we're doing a local update to skip polling
    const lastLocalChangeRef = useRef(0)

    // Reload all data from Supabase
    const reloadData = useCallback(async (tenantIdOverride) => {
        const tid = tenantIdOverride || user?.tenantId
        if (!tid) return
        
        try {
            const supabaseData = await db.loadAllData(tid)
            if (supabaseData) {
                console.log('🔄 Data refreshed. Quotes count:', supabaseData.quotes?.length)
                setData(supabaseData)
                setSupabaseConnected(true)
                console.log('🔄 Realtime: data refreshed for tenant', tid)
            }
        } catch (err) {
        }
    }, [user?.tenantId])

    // Debounced reload to avoid flooding
    const scheduleReload = useCallback(() => {
        // Skip if change was triggered locally (within last 5 seconds to be safe)
        if (Date.now() - lastLocalChangeRef.current < 5000) return

        if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current)
        reloadTimerRef.current = setTimeout(() => {
            reloadData()
        }, 1000)
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
            try {
                const parsed = JSON.parse(savedUserRecord)
                // Critical check: if the session has an invalid UUID format for tenantId, 
                // we must force clear it to prevent 400 errors across the app
                // Removed strict UUID check to support demo and legacy account formats
                if (!parsed.tenantId) {
                    console.warn('Session has no tenantId');
                    localStorage.clear();
                    window.location.replace('/login?reason=invalid-session');
                    return;
                }
                setUser(parsed)
                init(parsed)
            } catch (e) {
                console.error('Auth init error:', e);
                setLoading(false)
            }
        } else {
            setLoading(false)
        }
    }, [])

    const validateSession = useCallback(() => {
        if (!user?.tenantId) return false;
        // Allow any present tenantId to support both UUID and legacy/demo formats
        return true;
    }, [user])

    // This useEffect handles reloading data when the user object changes (e.g., after login)
    useEffect(() => {
        if (user && user.tenantId) {
            reloadData().catch(err => console.error("Error reloading data after user change:", err))
        }
    }, [user, reloadData])

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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => scheduleReload())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => scheduleReload())
            .subscribe((status) => {
                console.log('📡 Realtime status:', status)
            })

        // Polling fallback: reload every 15 seconds to catch any missed changes
        const pollInterval = setInterval(() => {
            if (Date.now() - lastLocalChangeRef.current > 10000) {
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

    // Theme Management
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }, [])

    const t = useCallback((key) => {
        const langData = translations[language] || translations['es']
        return langData[key] || key
    }, [language])

    const formatCurrency = useCallback((value) => {
        const symbolMap = { 'CLP': '$', 'USD': '$', 'EUR': '€', 'BRL': 'R$' }
        const symbol = symbolMap[currency] || '$'

        if (currency === 'CLP') {
            return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value)
        }
        return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'es-ES', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'CLP' ? 0 : 2
        }).format(value)
    }, [currency, language])

    // Alias for compatibility
    const formatCLP = formatCurrency

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
            id: `audit_${Date.now()}`,
            tenantId: user?.tenantId,
            date: new Date().toISOString(),
            userId: user?.id,
            userName: user?.name || user?.email || 'Usuario',
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

    // ============ SYNC: DELETE BOOK ============
    const deleteExistingBook = useCallback(async (bookId) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({
            ...prev,
            books: prev.books.filter(b => b.id !== bookId)
        }))
        if (supabaseConnected) {
            await db.deleteBook(bookId)
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
            id: db.iUUID(),
            tenantId: user?.tenantId,
            ...userData,
            avatar: userData.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
            firstLogin: userData.role === 'FREELANCE',
            socialLinks: {},
            bio: userData.bio || null
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
                    finances: { 
                        invoices: [], 
                        royalties: [],
                        sales: [],
                        consignments: [],
                        expenses: []
                    },
                    auditLog: [],
                    comments: [],
                    alerts: [],
                    quotes: [],
                    suppliers: [],
                    purchaseOrders: []
                })
                // Trigger a hard reload from db just to be sure
                await reloadData()
            }
            return success
        } finally {
            setLoading(false)
        }
    }, [user, reloadData])


    const addDocument = useCallback(async (docData) => {
        lastLocalChangeRef.current = Date.now()
        const doc = { ...docData, tenantId: user?.tenantId }
        setData(prev => ({ ...prev, documents: [...(prev.documents || []), doc] }))
        if (supabaseConnected) {
            await db.addDocumentEntry(doc)
        }
    }, [user, supabaseConnected])

    const editDocument = useCallback(async (docId, updates) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({
            ...prev,
            documents: (prev.documents || []).map(d => d.id === docId ? { ...d, ...updates } : d)
        }))
        if (supabaseConnected) {
            await db.updateDocumentEntry(docId, updates)
        }
    }, [supabaseConnected])

    const deleteDocument = useCallback(async (docId, fileUrl) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({
            ...prev,
            documents: (prev.documents || []).filter(d => d.id !== docId)
        }))
        if (supabaseConnected) {
            await db.deleteDocumentEntry(docId, fileUrl)
        }
    }, [supabaseConnected])

    const addNewQuote = useCallback(async (quoteData) => {
        lastLocalChangeRef.current = Date.now()
        // Use a UUID format even for temp to stay safe
        const tempId = `q-${Math.random().toString(36).substr(2, 9)}`
        const quote = { ...quoteData, id: tempId, tenantId: user?.tenantId }
        console.log('📝 Adding local quote:', tempId)
        setData(prev => ({
            ...prev,
            quotes: [quote, ...(prev.quotes || [])]
        }))
        if (supabaseConnected) {
            console.log('☁️ Saving quote to DB...')
            const saved = await db.addQuoteToDb(quote)
            if (saved && saved.id) {
                console.log('✅ Quote saved to DB. ID:', saved.id)
                // Transform snake_case back to camelCase for consistency in memory
                const finalQuote = {
                    id: saved.id,
                    bookId: saved.book_id,
                    provider: saved.provider,
                    requestedAmount: saved.requested_amount,
                    requestedAmount2: saved.requested_amount_2,
                    requestedAmount3: saved.requested_amount_3,
                    requestedAmount4: saved.requested_amount_4,
                    bindingType: saved.binding_type,
                    extraFinishes: saved.extra_finishes,
                    status: saved.status,
                    quotedAmount: saved.quoted_amount,
                    quotedAmount2: saved.quoted_amount_2,
                    quotedAmount3: saved.quoted_amount_3,
                    quotedAmount4: saved.quoted_amount_4,
                    deliveryDate: saved.delivery_date,
                    notes: saved.notes,
                    bookTitle: saved.book_title,
                    bookWidth: saved.book_width,
                    bookHeight: saved.book_height,
                    bookPagesBw: saved.book_pages_bw,
                    bookPagesColor: saved.book_pages_color,
                    bookCoverType: saved.book_cover_type,
                    bookFlaps: saved.book_flaps,
                    bookFlapWidth: saved.book_flap_width,
                    bookInteriorPaper: saved.book_interior_paper,
                    bookCoverPaper: saved.book_cover_paper,
                    bookCoverFinish: saved.book_cover_finish,
                    approvedAmount: saved.approved_amount,
                    createdAt: saved.created_at,
                    updatedAt: saved.updated_at
                }
                setData(prev => {
                    const quotes = (prev.quotes || [])
                    // Search by tempId or real ID (if reloadData already found it)
                    const index = quotes.findIndex(q => q.id === tempId || q.id === saved.id)
                    if (index >= 0) {
                        const newQuotes = [...quotes]
                        newQuotes[index] = finalQuote
                        console.log(`🧩 Updated existing quote ${tempId} -> ${saved.id}`)
                        return { ...prev, quotes: newQuotes }
                    } else {
                        console.log(`🧩 Quote ${saved.id} was missing from local state (nuked by reload?), adding it back.`)
                        return { ...prev, quotes: [finalQuote, ...quotes] }
                    }
                })
            } else {
                console.error('❌ Failed to save quote to DB')
            }
        }
    }, [user, supabaseConnected])

    const updateQuoteDetails = useCallback(async (quoteId, updates) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({
            ...prev,
            quotes: (prev.quotes || []).map(q => q.id === quoteId ? { ...q, ...updates } : q)
        }))
        if (supabaseConnected) {
            await db.updateQuoteInDb(quoteId, updates)
        }
    }, [supabaseConnected])

    const deleteExistingQuote = useCallback(async (quoteId) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({
            ...prev,
            quotes: (prev.quotes || []).filter(q => q.id !== quoteId)
        }))
        if (supabaseConnected) {
            await db.deleteQuoteFromDb(quoteId)
        }
    }, [supabaseConnected])

    const addNewSale = useCallback(async (saleData) => {
        lastLocalChangeRef.current = Date.now()
        const tempId = `s_temp_${Date.now()}`
        const sale = { id: tempId, ...saleData, tenantId: user?.tenantId }
        setData(prev => ({
            ...prev,
            finances: {
                ...prev.finances,
                sales: [sale, ...(prev.finances?.sales || [])]
            }
        }))
        if (supabaseConnected) {
            const saved = await db.addSaleToDb(sale)
            if (saved && saved.id) {
                setData(prev => {
                    const sales = (prev.finances?.sales || [])
                    const index = sales.findIndex(s => s.id === tempId || s.id === saved.id)
                    const updatedFinances = { ...prev.finances }
                    if (index >= 0) {
                        const newSales = [...sales]
                        newSales[index] = saved
                        updatedFinances.sales = newSales
                    } else {
                        updatedFinances.sales = [saved, ...sales]
                    }
                    return { ...prev, finances: updatedFinances }
                })
            }
        }
    }, [user, supabaseConnected])

    const updateSaleDetails = useCallback(async (saleId, updates) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({
            ...prev,
            finances: {
                ...prev.finances,
                sales: (prev.finances?.sales || []).map(s => s.id === saleId ? { ...s, ...updates } : s)
            }
        }))
        if (supabaseConnected) {
            await db.updateSaleInDb(saleId, updates)
        }
    }, [supabaseConnected])

    const deleteExistingSale = useCallback(async (saleId) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({
            ...prev,
            finances: {
                ...prev.finances,
                sales: (prev.finances?.sales || []).filter(s => s.id !== saleId)
            }
        }))
        if (supabaseConnected) {
            await db.deleteSaleFromDb(saleId)
        }
    }, [supabaseConnected])

    // ============ SUPPLIERS handlers ============
    const addSupplier = useCallback(async (supplierData) => {
        if (!validateSession()) return;
        lastLocalChangeRef.current = Date.now()
        const tempId = `sup_temp_${Date.now()}`
        const supplier = { id: tempId, ...supplierData, tenantId: user?.tenantId }
        setData(prev => ({ ...prev, suppliers: [supplier, ...(prev.suppliers || [])] }))
        if (supabaseConnected) {
            const saved = await db.addSupplierToDb(user.tenantId, supplierData)
            if (saved && saved.id) {
                setData(prev => {
                    const suppliers = (prev.suppliers || [])
                    const index = suppliers.findIndex(s => s.id === tempId || s.id === saved.id)
                    if (index >= 0) {
                        const newSupps = [...suppliers]
                        newSupps[index] = saved
                        return { ...prev, suppliers: newSupps }
                    } else {
                        return { ...prev, suppliers: [saved, ...suppliers] }
                    }
                })
            }
        }
    }, [user, supabaseConnected])

    const updateSupplier = useCallback(async (id, updates) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({ ...prev, suppliers: (prev.suppliers || []).map(s => s.id === id ? { ...s, ...updates } : s) }))
        if (supabaseConnected) {
            await db.updateSupplierInDb(id, updates)
        }
    }, [supabaseConnected])

    const deleteSupplier = useCallback(async (id) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({ ...prev, suppliers: (prev.suppliers || []).filter(s => s.id !== id) }))
        if (supabaseConnected) {
            await db.deleteSupplierFromDb(id)
        }
    }, [supabaseConnected])

    // ============ PURCHASE ORDERS handlers ============
    const addPurchaseOrder = useCallback(async (poData) => {
        lastLocalChangeRef.current = Date.now()
        const tempId = `po_temp_${Date.now()}`
        const po = { id: tempId, ...poData, tenantId: user?.tenantId }
        setData(prev => ({ ...prev, purchaseOrders: [po, ...(prev.purchaseOrders || [])] }))
        if (supabaseConnected) {
            const saved = await db.addPurchaseOrderToDb(user.tenantId, poData)
            if (saved && saved.id) {
                setData(prev => {
                    const orders = (prev.purchaseOrders || [])
                    const index = orders.findIndex(p => p.id === tempId || p.id === saved.id)
                    if (index >= 0) {
                        const newOrders = [...orders]
                        newOrders[index] = saved
                        return { ...prev, purchaseOrders: newOrders }
                    } else {
                        return { ...prev, purchaseOrders: [saved, ...orders] }
                    }
                })
            }
        }
    }, [user, supabaseConnected])

    const updatePurchaseOrder = useCallback(async (id, updates) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({ ...prev, purchaseOrders: (prev.purchaseOrders || []).map(p => p.id === id ? { ...p, ...updates } : p) }))
        if (supabaseConnected) {
            await db.updatePurchaseOrderInDb(id, updates)
        }
    }, [supabaseConnected])

    const deletePurchaseOrder = useCallback(async (id) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({ ...prev, purchaseOrders: (prev.purchaseOrders || []).filter(p => p.id !== id) }))
        if (supabaseConnected) {
            await db.deletePurchaseOrderFromDb(id)
        }
    }, [supabaseConnected])

    const receivePurchaseOrder = useCallback(async (poId, quantity, bookId) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({
            ...prev,
            purchaseOrders: (prev.purchaseOrders || []).map(p => p.id === poId ? { ...p, status: 'RECIBIDA', received_quantity: quantity } : p),
            inventory: {
                ...prev.inventory,
                physical: (prev.inventory?.physical || []).map(i => i.bookId === bookId ? { ...i, stock: i.stock + quantity } : i)
            }
        }))
        if (supabaseConnected) {
            await db.receivePurchaseOrderInDb(poId, quantity, bookId, user.tenantId)
        }
    }, [user, supabaseConnected])

    // ============ EXPENSES handlers ============
    const addExpense = useCallback(async (expenseData) => {
        lastLocalChangeRef.current = Date.now()
        const tempId = `exp_temp_${Date.now()}`
        const expense = { id: tempId, ...expenseData, tenantId: user?.tenantId }
        setData(prev => ({
            ...prev,
            finances: { ...prev.finances, expenses: [expense, ...(prev.finances?.expenses || [])] }
        }))
        if (supabaseConnected) {
            const saved = await db.addExpenseToDb(user.tenantId, expenseData)
            if (saved && saved.id) {
                setData(prev => {
                    const expenses = (prev.finances?.expenses || [])
                    const index = expenses.findIndex(e => e.id === tempId || e.id === saved.id)
                    const updatedFinances = { ...prev.finances }
                    if (index >= 0) {
                        const newExpenses = [...expenses]
                        newExpenses[index] = saved
                        updatedFinances.expenses = newExpenses
                    } else {
                        updatedFinances.expenses = [saved, ...expenses]
                    }
                    return { ...prev, finances: updatedFinances }
                })
            }
        }
    }, [user, supabaseConnected])

    const updateExpense = useCallback(async (id, updates) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({
            ...prev,
            finances: { ...prev.finances, expenses: (prev.finances?.expenses || []).map(e => e.id === id ? { ...e, ...updates } : e) }
        }))
        if (supabaseConnected) {
            await db.updateExpenseInDb(id, updates)
        }
    }, [supabaseConnected])

    const deleteExpense = useCallback(async (id) => {
        lastLocalChangeRef.current = Date.now()
        setData(prev => ({
            ...prev,
            finances: { ...prev.finances, expenses: (prev.finances?.expenses || []).filter(e => e.id !== id) }
        }))
        if (supabaseConnected) {
            await db.deleteExpenseFromDb(id)
        }
    }, [supabaseConnected])

    const loadDemo = useCallback(async () => {
        if (!user || user.role !== 'ADMIN') return false
        setLoading(true)
        try {
            await db.seedDemoData(user.tenantId, user.id)
            await reloadData()
            return true
        } finally {
            setLoading(false)
        }
    }, [user, reloadData])

    const clearDemo = useCallback(async () => {
        if (!user || user.role !== 'ADMIN') return false
        setLoading(true)
        try {
            await db.clearDemoData(user.tenantId)
            await reloadData()
            return true
        } finally {
            setLoading(false)
        }
    }, [user, reloadData])

    const value = {
        user, data, setData, login, logout, hasPermission,
        isSuperAdmin, isAdmin, isFreelance, isAutor, resetWorkspace,
        loadDemo, clearDemo,
        addAuditLog, updateBookStatus, addComment,
        markFreelanceOnboarded, formatCLP,
        addNewBook, updateBookDetails, deleteExistingBook, updateInventory, approveRoyalty,
        markAlertAsRead, markAllAlerts, updateProfile,
        addNewUser, updateExistingUser, deleteExistingUser,
        addDocument, editDocument, deleteDocument,
        addNewQuote, updateQuoteDetails, deleteExistingQuote,
        addNewSale, updateSaleDetails, deleteExistingSale,
        addSupplier, updateSupplier, deleteSupplier,
        addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, receivePurchaseOrder,
        addExpense, updateExpense, deleteExpense,
        theme, toggleTheme,
        language, setLanguage, t,
        currency, setCurrency, taxRate, setTaxRate, formatCurrency,
        loading, supabaseConnected, reloadData
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
