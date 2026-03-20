import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as db from '../lib/supabaseService'

export function useEditorialData(tenantId) {
    return useQuery({
        queryKey: ['editorialData', tenantId],
        queryFn: () => db.loadAllData(tenantId),
        enabled: !!tenantId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
    })
}

export function useQuotes(tenantId) {
    const queryClient = useQueryClient()

    const addMutation = useMutation({
        mutationFn: (quoteData) => db.addQuoteToDb(quoteData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }) => db.updateQuoteInDb(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => db.deleteQuoteFromDb(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    return {
        addQuote: addMutation.mutateAsync,
        updateQuote: updateMutation.mutateAsync,
        deleteQuote: deleteMutation.mutateAsync,
        isMutating: addMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading
    }
}

export function useBooks(tenantId) {
    const queryClient = useQueryClient()

    const addMutation = useMutation({
        mutationFn: (bookData) => db.addBook(bookData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }) => db.updateBook(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => db.deleteBook(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    const statusMutation = useMutation({
        mutationFn: ({ id, status }) => db.updateBookStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    return {
        addBook: addMutation.mutateAsync,
        updateBook: updateMutation.mutateAsync,
        deleteBook: deleteMutation.mutateAsync,
        updateBookStatus: statusMutation.mutateAsync
    }
}

export function useUsers(tenantId) {
    const queryClient = useQueryClient()

    const addMutation = useMutation({
        mutationFn: (userData) => db.addUser(userData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }) => db.updateUser(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => db.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    return {
        addUser: addMutation.mutateAsync,
        updateUser: updateMutation.mutateAsync,
        deleteUser: deleteMutation.mutateAsync
    }
}

export function useSuppliers(tenantId) {
    const queryClient = useQueryClient()

    const addMutation = useMutation({
        mutationFn: (supplierData) => db.addSupplierToDb(tenantId, supplierData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }) => db.updateSupplierInDb(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => db.deleteSupplierFromDb(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    return {
        addSupplier: addMutation.mutateAsync,
        updateSupplier: updateMutation.mutateAsync,
        deleteSupplier: deleteMutation.mutateAsync
    }
}

export function useAudit(tenantId) {
    const queryClient = useQueryClient()
    const mutation = useMutation({
        mutationFn: (entry) => db.addAuditLogEntry(entry),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })
    return { addAuditLog: mutation.mutateAsync }
}

export function useComments(tenantId) {
    const queryClient = useQueryClient()
    const mutation = useMutation({
        mutationFn: (comment) => db.addCommentEntry(comment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })
    return { addComment: mutation.mutateAsync }
}

export function useDocuments(tenantId) {
    const queryClient = useQueryClient()
    const addMutation = useMutation({
        mutationFn: (doc) => db.addDocumentEntry(doc),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })
    const updateMutation = useMutation({
        mutationFn: ({ id, updates }) => db.updateDocumentEntry(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })
    const deleteMutation = useMutation({
        mutationFn: ({ id, url }) => db.deleteDocumentEntry(id, url),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })
    return {
        addDocument: addMutation.mutateAsync,
        editDocument: updateMutation.mutateAsync,
        deleteDocument: deleteMutation.mutateAsync
    }
}

export function useSales(tenantId) {
    const queryClient = useQueryClient()
    const addMutation = useMutation({
        mutationFn: (sale) => db.addSaleToDb(sale),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })
    const updateMutation = useMutation({
        mutationFn: ({ id, updates }) => db.updateSaleInDb(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })
    const deleteMutation = useMutation({
        mutationFn: (id) => db.deleteSaleFromDb(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })
    return {
        addSale: addMutation.mutateAsync,
        updateSale: updateMutation.mutateAsync,
        deleteSale: deleteMutation.mutateAsync
    }
}

export function usePurchaseOrders(tenantId) {
    const queryClient = useQueryClient()
    const addMutation = useMutation({
        mutationFn: (poData) => db.addPurchaseOrderToDb(tenantId, poData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })
    const updateMutation = useMutation({
        mutationFn: ({ id, updates }) => db.updatePurchaseOrderInDb(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })
    const deleteMutation = useMutation({
        mutationFn: (id) => db.deletePurchaseOrderFromDb(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })
    const receiveMutation = useMutation({
        mutationFn: ({ poId, quantity, bookId }) => db.receivePurchaseOrderInDb(poId, quantity, bookId, tenantId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })
    return {
        addPurchaseOrder: addMutation.mutateAsync,
        updatePurchaseOrder: updateMutation.mutateAsync,
        deletePurchaseOrder: deleteMutation.mutateAsync,
        receivePurchaseOrder: receiveMutation.mutateAsync
    }
}

export function useClients(tenantId) {
    const queryClient = useQueryClient()

    const addMutation = useMutation({
        mutationFn: (clientData) => db.addClientToDb(tenantId, clientData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }) => db.updateClientInDb(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => db.deleteClientFromDb(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    return {
        addClient: addMutation.mutateAsync,
        updateClient: updateMutation.mutateAsync,
        deleteClient: deleteMutation.mutateAsync
    }
}

export function useExpenses(tenantId) {
    const queryClient = useQueryClient()
    const addMutation = useMutation({
        mutationFn: (expenseData) => db.addExpenseToDb(tenantId, expenseData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })
    return { addExpense: addMutation.mutateAsync }
}

export function useGlobalMeta(tenantId) {
    const queryClient = useQueryClient()
    
    const approveRoyaltyMutation = useMutation({
        mutationFn: (id) => db.updateRoyaltyStatus(id, 'aprobada'),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
    })

    const markAlertMutation = useMutation({
        mutationFn: (id) => db.markAlertRead(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
    })

    const markAllAlertsMutation = useMutation({
        mutationFn: () => db.markAllAlertsRead(tenantId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
    })

    const updateProfileMutation = useMutation({
        mutationFn: ({ id, updates }) => db.updateUserProfile(id, updates),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
    })

    const markFreelanceOnboardedMutation = useMutation({
        mutationFn: (userId) => db.updateUserFirstLogin(userId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
    })

    return {
        approveRoyalty: approveRoyaltyMutation.mutateAsync,
        markAlertRead: markAlertMutation.mutateAsync,
        markAllAlertsRead: markAllAlertsMutation.mutateAsync,
        updateProfile: updateProfileMutation.mutateAsync,
        markFreelanceOnboarded: markFreelanceOnboardedMutation.mutateAsync
    }
}

export function useEvents(tenantId) {
    const queryClient = useQueryClient()

    const addMutation = useMutation({
        mutationFn: ({ eventData, items }) => db.addEventToDb(tenantId, eventData, items),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }) => db.updateEventInDb(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    const settleMutation = useMutation({
        mutationFn: ({ id, itemsData }) => db.settleEventInDb(id, itemsData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => db.deleteEventFromDb(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['editorialData', tenantId] })
        },
    })

    return {
        addEvent: addMutation.mutateAsync,
        updateEvent: updateMutation.mutateAsync,
        settleEvent: settleMutation.mutateAsync,
        deleteEvent: deleteMutation.mutateAsync
    }
}

