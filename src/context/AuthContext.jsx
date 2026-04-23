import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import * as db from '../lib/supabaseService'
import { translations } from '../lib/translations'
import { useQueryClient } from '@tanstack/react-query'
import { 
    useEditorialData, 
    useQuotes, 
    useBooks, 
    useUsers, 
    useSuppliers, 
    useAudit, 
    useComments, 
    useDocuments, 
    useSales, 
    usePurchaseOrders, 
    useExpenses,
    useGlobalMeta,
    useClients,
    useEvents
} from '../hooks/useEditorialData'

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
    purchaseOrders: [],
    clients: []
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [initializing, setInitializing] = useState(true)
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
    const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'es')
    const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'CLP')
    const [taxRate, setTaxRate] = useState(() => parseFloat(localStorage.getItem('taxRate') || '19'))
    
    const queryClient = useQueryClient()
    
    // Core data fetch via React Query
    const { data: queryData, isLoading: queryLoading, refetch: refetchData } = useEditorialData(user?.tenantId)
    
    // Stable data reference to avoid unnecessary re-renders in children
    const data = useMemo(() => queryData || initialData, [queryData])

    // Mutations
    const quotes = useQuotes(user?.tenantId)
    const books = useBooks(user?.tenantId)
    const users = useUsers(user?.tenantId)
    const suppliers = useSuppliers(user?.tenantId)
    const audit = useAudit(user?.tenantId)
    const comments = useComments(user?.tenantId)
    const documents = useDocuments(user?.tenantId)
    const sales = useSales(user?.tenantId)
    const po = usePurchaseOrders(user?.tenantId)
    const expenses = useExpenses(user?.tenantId)
    const meta = useGlobalMeta(user?.tenantId)
    const clientsData = useClients(user?.tenantId)
    const eventsData = useEvents(user?.tenantId)

    // Session recovery
    useEffect(() => {
        const savedUserRecord = localStorage.getItem('editorial_user')
        if (savedUserRecord) {
            try {
                const parsed = JSON.parse(savedUserRecord)
                // Keep tenantId even if it's the dummy one, to avoid NOT NULL constraint violations
                if (parsed && parsed.id) {
                    setUser(parsed)
                } else {
                    localStorage.removeItem('editorial_user')
                }
            } catch (e) {
                console.error('Session restore error:', e);
                localStorage.removeItem('editorial_user')
            }
        }
        setInitializing(false)
    }, [])

    const login = useCallback(async (email, password) => {
        try {
            const found = await db.loginUser(email, password)
            if (found && found.id) {
                setUser(found)
                localStorage.setItem('editorial_user', JSON.stringify(found))
                return { success: true, user: found }
            }
            return { success: false, error: 'Credenciales incorrectas' }
        } catch (err) {
            console.error('Login error:', err)
            return { success: false, error: 'Error de conexión con la base de datos profesional' }
        }
    }, [])

    const updateLogo = useCallback((newUrl) => {
        if (user) {
            const updatedUser = { ...user, tenantLogo: newUrl };
            setUser(updatedUser);
            localStorage.setItem('editorial_user', JSON.stringify(updatedUser));
        }
    }, [user]);

    const logout = useCallback(() => {
        setUser(null)
        localStorage.removeItem('editorial_user')
        queryClient.clear()
    }, [queryClient])

    const hasPermission = useCallback((requiredRole) => {
        if (!user) return false
        if (requiredRole === 'SUPERADMIN') return user.role === 'SUPERADMIN'
        if (user.role === 'ADMIN') return true
        if (requiredRole === 'FREELANCE' && (user.role === 'FREELANCE' || user.role === 'ADMIN')) return true
        if (requiredRole === 'AUTOR' && user.role === 'AUTOR') return true
        return user.role === requiredRole
    }, [user])
    // ============ GLOBAL DATA SANITIZATION ============
    const sanitizeDates = (obj) => {
        if (!obj || typeof obj !== 'object') return obj
        const newObj = Array.isArray(obj) ? [...obj] : { ...obj }
        
        for (const key in newObj) {
            const val = newObj[key]
            // If it's a date-related key and it's an empty or whitespace string, make it null
            if (typeof val === 'string' && val.trim() === '' && (
                key.toLowerCase().includes('date') || 
                key.toLowerCase().includes('expiry') ||
                key === 'start_date' ||
                key === 'end_date'
            )) {
                newObj[key] = null
            } else if (val && typeof val === 'object') {
                newObj[key] = sanitizeDates(val)
            }
        }
        return newObj
    }

    // ============ WRAPPED OPERATIONS ============

    const addAuditLog = useCallback((action, type = 'general') => {
        if (!user) return Promise.reject('No user session')
        return audit.addAuditLog({
            id: db.iUUID(),
            tenantId: user.tenantId,
            date: new Date().toISOString(),
            user_id: user.id,
            user_name: user.name || user.email || 'Usuario',
            action,
            type
        })
    }, [user, audit])

    const updateBookStatus = useCallback(async (bookId, newStatus) => {
        const bookObj = data.books.find(b => b.id === bookId)
        if (bookObj) addAuditLog(`Movió '${bookObj.title}' a ${newStatus}`, 'kanban')
        return books.updateBookStatus({ id: bookId, status: newStatus })
    }, [data.books, books, addAuditLog])

    const addComment = useCallback((bookId, text, category) => {
        if (!user) return Promise.reject('No user session')
        return comments.addComment({
            id: db.iUUID(),
            tenantId: user.tenantId,
            bookId,
            userId: user.id,
            userName: user.name,
            role: user.role,
            text,
            date: new Date().toISOString(),
            category
        })
    }, [user, comments])

    const addNewBook = useCallback((bookData) => books.addBook(sanitizeDates({ 
        ...bookData, 
        id: bookData.id || db.iUUID(), 
        tenantId: user?.tenantId,
        createdAt: bookData.createdAt || new Date().toISOString()
    })), [user?.tenantId, books])

    const updateBookDetails = useCallback((bookId, updates) => books.updateBook({ id: bookId, updates: sanitizeDates(updates) }), [books])
    const deleteExistingBook = useCallback((bookId) => books.deleteBook(bookId), [books])

    const updateInventory = useCallback((bookId, updater) => {
        // This remains slightly legacy as it's a complex multi-step update
        const physical = [...data.inventory.physical]
        const idx = physical.findIndex(p => p.bookId === bookId)
        let updatedPhysical = idx >= 0 ? updater(physical[idx]) : updater(null, bookId)
        updatedPhysical.tenantId = user?.tenantId
        return db.upsertInventoryPhysical(bookId, updatedPhysical).then(() => refetchData())
    }, [data.inventory.physical, user?.tenantId, refetchData])

    const addNewUser = useCallback((userData) => users.addUser({
        id: userData.id || db.iUUID(),
        tenantId: user?.tenantId,
        ...userData,
        avatar: userData.avatar || userData.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        firstLogin: userData.firstLogin !== undefined ? userData.firstLogin : userData.role === 'FREELANCE',
        socialLinks: userData.socialLinks || {},
        bio: userData.bio || null
    }), [user?.tenantId, users])

    const updateExistingUser = useCallback((userId, updates) => users.updateUser({ id: userId, updates }), [users])
    const deleteExistingUser = useCallback((userId) => users.deleteUser(userId), [users])

    const addNewQuote = useCallback((quoteData) => quotes.addQuote(sanitizeDates({ 
        ...quoteData, 
        id: quoteData.id || db.iUUID(), 
        tenantId: user?.tenantId,
        status: quoteData.status || 'Solicitada',
        createdAt: quoteData.createdAt || new Date().toISOString()
    })), [user?.tenantId, quotes])

    const updateQuoteDetails = useCallback((quoteId, updates) => quotes.updateQuote({ id: quoteId, updates: sanitizeDates(updates) }), [quotes])
    const deleteExistingQuote = useCallback((quoteId) => quotes.deleteQuote(quoteId), [quotes])

    const addNewSale = useCallback((saleData) => sales.addSale(sanitizeDates({ 
        ...saleData, 
        id: saleData.id || db.iUUID(), 
        tenantId: user?.tenantId 
    })), [user?.tenantId, sales])

    const addPurchaseOrder = useCallback((poData) => po.addPurchaseOrder(sanitizeDates({
        ...poData,
        id: poData.id || db.iUUID(),
        date_ordered: poData.date_ordered || new Date().toISOString()
    })), [user?.tenantId, po])

    const resetWorkspace = async () => {
        if (!user || !['ADMIN', 'SUPERADMIN'].includes(user.role)) return false
        const success = await db.resetTenantData(user.tenantId, user.id)
        if (success) await refetchData()
        return success
    }

    const t = useCallback((key) => {
        const langData = translations[language] || translations['es']
        return langData[key] || key
    }, [language])

    const formatCurrency = useCallback((value) => {
        const symbolMap = { 'CLP': '$', 'USD': '$', 'EUR': '€', 'BRL': 'R$' }
        const symbol = symbolMap[currency] || '$'
        if (currency === 'CLP') return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value)
        return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'es-ES', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value)
    }, [currency, language])

    const isGlobalLoading = initializing || (user && queryLoading)

    const contextValue = useMemo(() => ({
        user, data, login, logout, hasPermission,
        isSuperAdmin: () => user?.role === 'SUPERADMIN',
        isAdmin: () => ['ADMIN', 'SUPERADMIN'].includes(user?.role),
        isFreelance: () => user?.role === 'FREELANCE',
        isAutor: () => user?.role === 'AUTOR',
        resetWorkspace, 
        loadDemo: () => db.seedDemoData(user.tenantId).then(() => refetchData()), 
        clearDemo: () => db.clearDemoData(user.tenantId).then(() => refetchData()),
        addAuditLog, updateBookStatus, addComment,
        formatCLP: formatCurrency,
        addNewBook, updateBookDetails, deleteExistingBook, updateInventory, 
        addNewUser, updateExistingUser, deleteExistingUser,
        addDocument: (docData) => documents.addDocument({ ...docData, id: docData.id || db.iUUID(), tenantId: user?.tenantId }),
        editDocument: (docId, updates) => documents.editDocument({ id: docId, updates }),
        deleteDocument: (docId, url) => documents.deleteDocument({ id: docId, url }),
        addNewQuote, updateQuoteDetails, deleteExistingQuote,
        addNewSale, updateSaleDetails: (saleId, updates) => sales.updateSale({ id: saleId, updates: sanitizeDates(updates) }),
        deleteExistingSale: (saleId) => sales.deleteSale(saleId),
        addSupplier: (supplierData) => suppliers.addSupplier({ ...supplierData, id: supplierData.id || db.iUUID() }),
        updateSupplier: (supplierId, updates) => suppliers.updateSupplier({ id: supplierId, updates }),
        deleteSupplier: (supplierId) => suppliers.deleteSupplier(supplierId),
        addNewClient: (clientData) => clientsData.addClient({ ...clientData, id: clientData.id || db.iUUID(), tenantId: user?.tenantId }),
        updateExistingClient: (clientId, updates) => clientsData.updateClient({ id: clientId, updates }),
        deleteExistingClient: (clientId) => clientsData.deleteClient(clientId),
        addPurchaseOrder, 
        addNewEvent: (payload) => eventsData.addEvent({ 
            ...payload, 
            eventData: sanitizeDates(payload.eventData) 
        }),
        updateEvent: (payload) => eventsData.updateEvent({ 
            ...payload, 
            updates: sanitizeDates(payload.updates) 
        }),
        settleEvent: (payload) => eventsData.settleEvent(payload),
        reopenEvent: (id) => eventsData.reopenEvent(id),
        deleteEvent: (id) => eventsData.deleteEvent(id),
        updatePurchaseOrder: (poId, updates) => po.updatePurchaseOrder({ id: poId, updates: sanitizeDates(updates) }), 
        deletePurchaseOrder: (poId) => po.deletePurchaseOrder(poId), 
        receivePurchaseOrder: (poId, qt, bId) => po.receivePurchaseOrder({ poId, quantity: qt, bookId: bId }),
        addExpense: (expData) => expenses.addExpense(sanitizeDates({ ...expData, id: expData.id || db.iUUID() })),
        updateExpense: (id, updates) => expenses.updateExpense({ id, updates: sanitizeDates(updates) }),
        deleteExpense: (id) => expenses.deleteExpense(id),
        markFreelanceOnboarded: () => {
             const updatedUser = { ...user, firstLogin: false }
             setUser(updatedUser)
             localStorage.setItem('editorial_user', JSON.stringify(updatedUser))
             return meta.markFreelanceOnboarded(user.id)
        },
        approveRoyalty: meta.approveRoyalty,
        markAlertAsRead: meta.markAlertRead,
        markAllAlerts: meta.markAllAlertsRead,
        updateProfile: (userId, updates) => meta.updateProfile({ id: userId, updates }),
        theme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
        language, setLanguage, t,
        currency, setCurrency, taxRate, setTaxRate, formatCurrency,
        loading: isGlobalLoading, reloadData: refetchData
    }), [
        user, data, login, logout, hasPermission, addAuditLog, updateBookStatus, addComment, 
        addNewBook, updateBookDetails, deleteExistingBook, updateInventory, refetchData,
        addNewUser, updateExistingUser, deleteExistingUser,
        addNewQuote, updateQuoteDetails, deleteExistingQuote,
        addNewSale, sales, suppliers, documents, po, expenses, eventsData,
        theme, language, currency, taxRate, t, formatCurrency, isGlobalLoading
    ])

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        localStorage.setItem('theme', theme)
    }, [theme])

    return (
        <AuthContext.Provider value={contextValue}>
            {initializing ? (
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>Editorial Pro</div>
                        <p>Iniciando sistema...</p>
                    </div>
                 </div>
            ) : (
                <>
                    {children}
                    {user && queryLoading && (
                        <div className="fixed inset-0 z-[9999] bg-dark-900/40 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="bg-dark-800 p-6 rounded-2xl border border-primary/20 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                <p className="text-white font-medium text-sm tracking-wide">Actualizando datos...</p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
