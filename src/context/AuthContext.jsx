import { createContext, useContext, useState, useEffect } from 'react'
import initialData from '../data/initialData.json'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [data, setData] = useState(() => {
        const saved = localStorage.getItem('editorial_data')
        return saved ? JSON.parse(saved) : initialData
    })

    useEffect(() => {
        const savedUser = localStorage.getItem('editorial_user')
        if (savedUser) setUser(JSON.parse(savedUser))
    }, [])

    useEffect(() => {
        localStorage.setItem('editorial_data', JSON.stringify(data))
    }, [data])

    const login = (email, password) => {
        const found = data.users.find(u => u.email === email && u.password === password)
        if (found) {
            const userObj = { ...found }
            delete userObj.password
            setUser(userObj)
            localStorage.setItem('editorial_user', JSON.stringify(userObj))
            return { success: true, user: userObj }
        }
        return { success: false, error: 'Credenciales incorrectas' }
    }

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

    const addAuditLog = (action, type = 'general') => {
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
    }

    const updateBookStatus = (bookId, newStatus) => {
        setData(prev => ({
            ...prev,
            books: prev.books.map(b => b.id === bookId ? { ...b, status: newStatus } : b)
        }))
        const book = data.books.find(b => b.id === bookId)
        if (book) {
            addAuditLog(`Movió '${book.title}' a ${newStatus}`, 'kanban')
        }
    }

    const addComment = (bookId, text, category) => {
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
    }

    const markFreelanceOnboarded = () => {
        if (!user || user.role !== 'FREELANCE') return
        setData(prev => ({
            ...prev,
            users: prev.users.map(u => u.id === user.id ? { ...u, firstLogin: false } : u)
        }))
        setUser(prev => ({ ...prev, firstLogin: false }))
        localStorage.setItem('editorial_user', JSON.stringify({ ...user, firstLogin: false }))
    }

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
        markFreelanceOnboarded, formatCLP
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
