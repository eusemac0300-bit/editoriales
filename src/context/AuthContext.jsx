import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import * as db from '../lib/supabaseService'
import { supabase } from '../lib/supabase'
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
    useExpenses 
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
    purchaseOrders: []
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [data, setData] = useState(initialData)
    const [loading, setLoading] = useState(true)
    const [supabaseConnected, setSupabaseConnected] = useState(true)
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
    const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'es')
    const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'CLP')
    const [taxRate, setTaxRate] = useState(() => parseFloat(localStorage.getItem('taxRate') || '0.19'))
    
    const queryClient = useQueryClient()
    const { data: queryData, isLoading: queryLoading, refetch: refetchData } = useEditorialData(user?.tenantId)
    
    // Mutations from React Query
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

    // Sync local state with React Query data for compatibility with legacy components
    useEffect(() => {
        if (queryData) {
            setData(queryData)
        }
    }, [queryData])

    // Session recovery
    useEffect(() => {
        const savedUserRecord = localStorage.getItem('editorial_user')
        if (savedUserRecord) {
            try {
                const parsed = JSON.parse(savedUserRecord)
                if (parsed?.tenantId) {
                    setUser(parsed)
                } else {
                    localStorage.removeItem('editorial_user')
                }
            } catch (e) {
                console.error('Session restore error:', e);
            }
        }
        setLoading(false)
    }, [])

    const login = useCallback(async (email, password) => {
        const found = await db.loginUser(email, password)
        if (found && found.tenantId) {
            setUser(found)
            localStorage.setItem('editorial_user', JSON.stringify(found))
            return { success: true, user: found }
        }
        return { success: false, error: 'Credenciales incorrectas' }
    }, [])

    const logout = () => {
        setUser(null)
        setData(initialData)
        localStorage.removeItem('editorial_user')
        queryClient.clear()
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

    // ============ WRAPPED OPERATIONS (Ensuring IDs and TenantId) ============

    const addAuditLog = (action, type = 'general') => {
        return audit.addAuditLog({
            id: db.iUUID(),
            tenant_id: user.tenantId,
            date: new Date().toISOString(),
            user_id: user.id,
            user_name: user.name || user.email || 'Usuario',
            action,
            type
        })
    }

    const updateBookStatus = async (bookId, newStatus) => {
        const bookObj = data.books.find(b => b.id === bookId)
        if (bookObj) addAuditLog(`Movió '${bookObj.title}' a ${newStatus}`, 'kanban')
        return books.updateBookStatus({ id: bookId, status: newStatus })
    }

    const addComment = (bookId, text, category) => {
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
    }

    // ---- BOOKS ----
    const addNewBook = (bookData) => books.addBook({ 
        ...bookData, 
        id: bookData.id || db.iUUID(), 
        tenantId: user?.tenantId,
        createdAt: bookData.createdAt || new Date().toISOString()
    })
    const updateBookDetails = (bookId, updates) => books.updateBook({ id: bookId, updates })
    const deleteExistingBook = (bookId) => books.deleteBook(bookId)

    // ---- INVENTORY & FINANCES (Direct DB for now as they are complex) ----
    const updateInventory = (bookId, updater) => {
        const physical = [...data.inventory.physical]
        const idx = physical.findIndex(p => p.bookId === bookId)
        let updatedPhysical = idx >= 0 ? updater(physical[idx]) : updater(null, bookId)
        updatedPhysical.tenantId = user?.tenantId
        return db.upsertInventoryPhysical(bookId, updatedPhysical).then(() => refetchData())
    }

    const approveRoyalty = (royaltyId) => db.updateRoyaltyStatus(royaltyId, 'aprobada').then(() => refetchData())
    const markAlertAsRead = (alertId) => db.markAlertRead(alertId).then(() => refetchData())
    const markAllAlerts = () => db.markAllAlertsRead().then(() => refetchData())
    const updateProfile = (userId, updates) => db.updateUserProfile(userId, updates).then(() => refetchData())

    // ---- USERS ----
    const addNewUser = (userData) => users.addUser({
        id: userData.id || db.iUUID(),
        tenantId: user?.tenantId,
        ...userData,
        avatar: userData.avatar || userData.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        firstLogin: userData.firstLogin !== undefined ? userData.firstLogin : userData.role === 'FREELANCE',
        socialLinks: userData.socialLinks || {},
        bio: userData.bio || null
    })
    const updateExistingUser = (userId, updates) => users.updateUser({ id: userId, updates })
    const deleteExistingUser = (userId) => users.deleteUser(userId)

    // ---- DOCUMENTS ----
    const addDocument = (docData) => documents.addDocument({ 
        ...docData, 
        id: docData.id || db.iUUID(), 
        tenantId: user?.tenantId 
    })
    const editDocument = (docId, updates) => documents.editDocument({ id: docId, updates })
    const deleteDocument = (docId, fileUrl) => documents.deleteDocument({ id: docId, url: fileUrl })

    // ---- QUOTES ----
    const addNewQuote = (quoteData) => quotes.addQuote({ 
        ...quoteData, 
        id: quoteData.id || db.iUUID(), 
        tenantId: user?.tenantId,
        status: quoteData.status || 'Solicitada',
        createdAt: quoteData.createdAt || new Date().toISOString()
    })
    const updateQuoteDetails = (quoteId, updates) => quotes.updateQuote({ id: quoteId, updates })
    const deleteExistingQuote = (quoteId) => quotes.deleteQuote(quoteId)

    // ---- SALES ----
    const addNewSale = (saleData) => sales.addSale({ 
        ...saleData, 
        id: saleData.id || db.iUUID(), 
        tenantId: user?.tenantId 
    })
    const updateSaleDetails = (saleId, updates) => sales.updateSale({ id: saleId, updates })
    const deleteExistingSale = (saleId) => sales.deleteSale(saleId)

    // ---- SUPPLIERS ----
    const addSupplier = (supplierData) => suppliers.addSupplier({
        ...supplierData,
        id: supplierData.id || db.iUUID()
    })
    const updateSupplier = (supplierId, updates) => suppliers.updateSupplier({ id: supplierId, updates })
    const deleteSupplier = (supplierId) => suppliers.deleteSupplier(supplierId)

    // ---- PURCHASE ORDERS ----
    const addPurchaseOrder = (poData) => po.addPurchaseOrder({
        ...poData,
        id: poData.id || db.iUUID(),
        date_ordered: poData.date_ordered || new Date().toISOString()
    })
    const updatePurchaseOrder = (poId, updates) => po.updatePurchaseOrder({ id: poId, updates })
    const deletePurchaseOrder = (poId) => po.deletePurchaseOrder(poId)
    const receivePurchaseOrder = (poId, quantity, bookId) => po.receivePurchaseOrder({ poId, quantity, bookId })

    // ---- EXPENSES ----
    const addExpense = (expenseData) => expenses.addExpense({
        ...expenseData,
        id: expenseData.id || db.iUUID()
    })

    // ---- SYSTEM ----
    const resetWorkspace = async () => {
        if (!user || user.role !== 'ADMIN') return false
        const success = await db.resetTenantData(user.tenantId, user.id)
        if (success) await refetchData()
        return success
    }

    const markFreelanceOnboarded = () => {
        const updatedUser = { ...user, firstLogin: false }
        setUser(updatedUser)
        localStorage.setItem('editorial_user', JSON.stringify(updatedUser))
        return db.updateUserFirstLogin(user.id).then(() => refetchData())
    }

    const loadDemo = () => db.seedDemoData(user.tenantId).then(() => refetchData())
    const clearDemo = () => db.clearDemoData(user.tenantId).then(() => refetchData())

    // ---- UTILS ----
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

    const value = {
        user, data, setData, login, logout, hasPermission,
        isSuperAdmin: () => user?.role === 'SUPERADMIN',
        isAdmin: () => user?.role === 'ADMIN',
        isFreelance: () => user?.role === 'FREELANCE',
        isAutor: () => user?.role === 'AUTOR',
        resetWorkspace, loadDemo, clearDemo,
        addAuditLog, updateBookStatus, addComment,
        markFreelanceOnboarded, formatCLP: formatCurrency,
        addNewBook, updateBookDetails, deleteExistingBook, updateInventory, approveRoyalty,
        markAlertAsRead, markAllAlerts, updateProfile,
        addNewUser, updateExistingUser, deleteExistingUser,
        addDocument, editDocument, deleteDocument,
        addNewQuote, updateQuoteDetails, deleteExistingQuote,
        addNewSale, updateSaleDetails, deleteExistingSale,
        addSupplier, updateSupplier, deleteSupplier,
        addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, receivePurchaseOrder,
        addExpense,
        theme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
        language, setLanguage, t,
        currency, setCurrency, taxRate, setTaxRate, formatCurrency,
        loading: loading || queryLoading, supabaseConnected, reloadData: refetchData
    }

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        localStorage.setItem('theme', theme)
    }, [theme])

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
            <p>Conectando con la base de datos profesional...</p>
        </div>
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
