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
    const [supabaseConnected, setSupabaseConnected] = useState(true) // Assumed true with React Query/Supabase setup
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
    const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'es')
    const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'CLP')
    const [taxRate, setTaxRate] = useState(() => parseFloat(localStorage.getItem('taxRate') || '0.19'))
    
    const queryClient = useQueryClient()
    const { data: queryData, isLoading: queryLoading, refetch: refetchData } = useEditorialData(user?.tenantId)
    
    // Mutations
    const { addQuote, updateQuote, deleteQuote } = useQuotes(user?.tenantId)
    const { addBook, updateBook, deleteBook, updateBookStatus: pushBookStatus } = useBooks(user?.tenantId)
    const { addUser, updateUser, deleteUser } = useUsers(user?.tenantId)
    const { addSupplier, updateSupplier, deleteSupplier } = useSuppliers(user?.tenantId)
    const { addAuditLog: pushAuditLog } = useAudit(user?.tenantId)
    const { addComment: pushComment } = useComments(user?.tenantId)
    const { addDocument: pushDocument, editDocument, deleteDocument } = useDocuments(user?.tenantId)
    const { addSale, updateSale, deleteSale } = useSales(user?.tenantId)
    const { addPurchaseOrder, updatePurchaseOrder: pushPurchaseOrder, deletePurchaseOrder, receivePurchaseOrder } = usePurchaseOrders(user?.tenantId)
    const { addExpense: pushExpense } = useExpenses(user?.tenantId)

    // Update local data state (compatibility layer)
    useEffect(() => {
        if (queryData) {
            setData(queryData)
        }
    }, [queryData])

    // Load user from localStorage on mount
    useEffect(() => {
        const savedUserRecord = localStorage.getItem('editorial_user')
        if (savedUserRecord) {
            try {
                const parsed = JSON.parse(savedUserRecord)
                if (!parsed.tenantId) {
                    console.warn('Session has no tenantId');
                    localStorage.clear();
                    window.location.replace('/login?reason=invalid-session');
                    return;
                }
                setUser(parsed)
            } catch (e) {
                console.error('Auth init error:', e);
            }
        }
        setLoading(false)
    }, [])

    const validateSession = useCallback(() => !!user?.tenantId, [user])

    const login = useCallback(async (email, password) => {
        const found = await db.loginUser(email, password)
        if (found && found.tenantId) {
            setUser(found)
            localStorage.setItem('editorial_user', JSON.stringify(found))
            return { success: true, user: found }
        }
        // Fallback demo local (optional, kept for dev speed)
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
        setData(initialData)
        localStorage.removeItem('editorial_user')
        localStorage.removeItem('editorial_data')
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

    const isSuperAdmin = () => user?.role === 'SUPERADMIN'
    const isAdmin = () => user?.role === 'ADMIN'
    const isFreelance = () => user?.role === 'FREELANCE'
    const isAutor = () => user?.role === 'AUTOR'

    // Wrapped Operations
    const addAuditLog = (action, type = 'general') => {
        const entry = {
            id: `audit_${Date.now()}`,
            tenantId: user?.tenantId,
            date: new Date().toISOString(),
            userId: user?.id,
            userName: user?.name || user?.email || 'Usuario',
            action,
            type
        }
        return pushAuditLog(entry)
    }

    const updateBookStatus = async (bookId, newStatus) => {
        const book = data.books.find(b => b.id === bookId)
        if (book) addAuditLog(`Movió '${book.title}' a ${newStatus}`, 'kanban')
        return pushBookStatus({ id: bookId, status: newStatus })
    }

    const addComment = (bookId, text, category) => {
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
        return pushComment(comment)
    }

    const addNewBook = (bookData) => addBook({ ...bookData, tenantId: user?.tenantId })
    const updateBookDetails = (bookId, updates) => updateBook({ id: bookId, updates })
    const deleteExistingBook = (bookId) => deleteBook(bookId)

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

    const addNewUser = (userData) => {
        const newUser = {
            id: db.iUUID(),
            tenantId: user?.tenantId,
            ...userData,
            avatar: userData.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
            firstLogin: userData.role === 'FREELANCE',
            socialLinks: {},
            bio: userData.bio || null
        }
        return addUser(newUser)
    }

    const updateExistingUser = (userId, updates) => updateUser({ id: userId, updates })
    const deleteExistingUser = (userId) => deleteUser(userId)

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

    const addDocument = (docData) => pushDocument({ ...docData, tenantId: user?.tenantId })
    const addNewQuote = (quoteData) => addQuote({ ...quoteData, tenantId: user?.tenantId })
    const updateQuoteDetails = (quoteId, updates) => updateQuote({ id: quoteId, updates })
    const deleteExistingQuote = (quoteId) => deleteQuote(quoteId)

    const addNewSale = (saleData) => addSale({ ...saleData, tenantId: user?.tenantId })
    const updateSaleDetails = (saleId, updates) => updateSale({ id: saleId, updates })
    const deleteExistingSale = (saleId) => deleteSale(saleId)

    // Legacy naming compatibility
    const addNewUserWrapper = addNewUser
    const updateExistingUserWrapper = updateExistingUser
    const deleteExistingUserWrapper = deleteExistingUser

    const loadDemo = () => db.seedDemoData(user.tenantId).then(() => refetchData())
    const clearDemo = () => db.clearDemoData(user.tenantId).then(() => refetchData())

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
        isSuperAdmin, isAdmin, isFreelance, isAutor, resetWorkspace,
        loadDemo, clearDemo,
        addAuditLog, updateBookStatus, addComment,
        markFreelanceOnboarded, formatCLP: formatCurrency,
        addNewBook, updateBookDetails, deleteExistingBook, updateInventory, approveRoyalty,
        markAlertAsRead, markAllAlerts, updateProfile,
        addNewUser, updateExistingUser, deleteExistingUser,
        addDocument, editDocument, deleteDocument,
        addNewQuote, updateQuoteDetails, deleteExistingQuote,
        addNewSale, updateSaleDetails, deleteExistingSale,
        addSupplier, updateSupplier, deleteSupplier,
        addPurchaseOrder, updatePurchaseOrder: pushPurchaseOrder, deletePurchaseOrder, receivePurchaseOrder,
        addExpense: pushExpense,
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
