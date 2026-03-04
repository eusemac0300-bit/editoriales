import { supabase } from './supabase'

// ============ LOAD ALL DATA ============
export async function loadAllData(tenantId) {
    if (!tenantId) return null
    try {
        const [
            { data: users, error: usersErr },
            { data: books, error: booksErr },
            { data: invPhysical, error: invPhysErr },
            { data: invDigital, error: invDigErr },
            { data: invoices, error: invoicesErr },
            { data: royalties, error: royaltiesErr },
            { data: auditLog, error: auditErr },
            { data: comments, error: commentsErr },
            { data: alerts, error: alertsErr },
            { data: documents, error: docsErr }
        ] = await Promise.all([
            supabase.from('users').select('*').eq('tenant_id', tenantId),
            supabase.from('books').select('*').eq('tenant_id', tenantId),
            supabase.from('inventory_physical').select('*').eq('tenant_id', tenantId),
            supabase.from('inventory_digital').select('*').eq('tenant_id', tenantId),
            supabase.from('invoices').select('*').eq('tenant_id', tenantId).order('date', { ascending: false }),
            supabase.from('royalties').select('*').eq('tenant_id', tenantId),
            supabase.from('audit_log').select('*').eq('tenant_id', tenantId).order('date', { ascending: false }),
            supabase.from('comments').select('*').eq('tenant_id', tenantId).order('date', { ascending: true }),
            supabase.from('alerts').select('*').eq('tenant_id', tenantId).order('date', { ascending: false }),
            supabase.from('documents').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
        ])

        const criticalErrors = [usersErr, booksErr, invPhysErr, invoicesErr, auditErr, commentsErr].filter(Boolean)
        if (criticalErrors.length > 0) {
            console.error('Supabase critical load errors:', criticalErrors)
            return null
        }

        const nonCriticalErrors = [invDigErr, royaltiesErr, alertsErr, docsErr].filter(Boolean)
        if (nonCriticalErrors.length > 0) {
            console.warn('Supabase non-critical load errors (missing features):', nonCriticalErrors)
        }

        // Transform snake_case to camelCase for books
        const transformedBooks = (books || []).map(b => ({
            id: b.id,
            title: b.title,
            authorId: b.author_id,
            authorName: b.author_name,
            isbn: b.isbn,
            genre: b.genre,
            status: b.status,
            assignedTo: b.assigned_to || [],
            royaltyPercent: b.royalty_percent,
            advance: b.advance,
            pvp: b.pvp,
            contractExpiry: b.contract_expiry,
            createdAt: b.created_at,
            cover: b.cover,
            synopsis: b.synopsis,
            width: b.width || '',
            height: b.height || '',
            pages: b.pages || '',
            coverType: b.cover_type || '',
            flaps: b.flaps || '',
            interiorPaper: b.interior_paper || '',
            coverPaper: b.cover_paper || '',
            coverFinish: b.cover_finish || '',
            tiraje: b.tiraje || 0,
            escandalloCosts: b.escandallo_costs || { edicion: 0, correccion: 0, maquetacion: 0, diseno: 0, impresion: 0, marketing: 0, distribucion: 0, otros: 0 }
        }))

        // Transform users
        const transformedUsers = (users || []).map(u => ({
            id: u.id,
            email: u.email,
            password: u.password,
            name: u.name,
            role: u.role,
            avatar: u.avatar,
            title: u.title,
            bio: u.bio,
            socialLinks: u.social_links || {},
            firstLogin: u.first_login
        }))

        // Transform inventory
        const physical = (invPhysical || []).map(p => ({
            bookId: p.book_id,
            stock: p.stock,
            minStock: p.min_stock,
            entries: p.entries || [],
            exits: p.exits || []
        }))

        const digital = (invDigital || []).map(d => ({
            bookId: d.book_id,
            versions: d.versions || [],
            sales: d.sales || []
        }))

        // Transform invoices
        const transformedInvoices = (invoices || []).map(i => ({
            id: i.id,
            bookId: i.book_id,
            type: i.type,
            concept: i.concept,
            amount: i.amount,
            provider: i.provider,
            date: i.date,
            status: i.status
        }))

        // Transform royalties
        const transformedRoyalties = (royalties || []).map(r => ({
            id: r.id,
            authorId: r.author_id,
            bookId: r.book_id,
            period: r.period,
            totalSales: r.total_sales,
            salesAmount: r.sales_amount,
            royaltyPercent: r.royalty_percent,
            grossRoyalty: r.gross_royalty,
            advance: r.advance,
            netRoyalty: r.net_royalty,
            status: r.status
        }))

        // Transform audit log
        const transformedAudit = (auditLog || []).map(a => ({
            id: a.id,
            date: a.date,
            userId: a.user_id,
            userName: a.user_name,
            action: a.action,
            type: a.type
        }))

        // Transform comments
        const transformedComments = (comments || []).map(c => ({
            id: c.id,
            bookId: c.book_id,
            userId: c.user_id,
            userName: c.user_name,
            role: c.role,
            text: c.text,
            date: c.date,
            category: c.category
        }))

        // Transform alerts
        const transformedAlerts = (alerts || []).map(a => ({
            id: a.id,
            type: a.type,
            bookId: a.book_id,
            message: a.message,
            date: a.date,
            read: a.read
        }))

        // Transform documents
        const transformedDocuments = (documents || []).map(d => ({
            id: d.id,
            bookId: d.book_id,
            name: d.name,
            type: d.type,
            fileUrl: d.file_url,
            size: d.size,
            amount: d.amount,
            uploadedBy: d.uploaded_by,
            createdAt: d.created_at
        }))

        return {
            users: transformedUsers,
            books: transformedBooks,
            inventory: {
                physical,
                digital
            },
            finances: {
                invoices: transformedInvoices,
                royalties: transformedRoyalties
            },
            auditLog: transformedAudit,
            comments: transformedComments,
            alerts: transformedAlerts,
            documents: transformedDocuments
        }
    } catch (err) {
        console.error('Failed to load data from Supabase:', err)
        return null
    }
}

// ============ SUPERADMIN DATA ============
export async function loadSuperAdminData() {
    try {
        const [
            { data: tenants, error: tErr },
            { data: users, error: uErr }
        ] = await Promise.all([
            supabase.from('tenants').select('*').order('created_at', { ascending: false }),
            supabase.from('users').select('id, tenant_id, email, name, role').eq('role', 'ADMIN')
        ])

        if (tErr || uErr) {
            console.error('Superadmin load error', tErr, uErr)
            return null
        }

        return { tenants, adminUsers: users }
    } catch (err) {
        console.error('Failed to load superadmin data:', err)
        return null
    }
}

// ============ USER AUTH ============
export async function loginUser(email, password) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

    if (error || !data) return null

    return {
        id: data.id,
        tenantId: data.tenant_id,
        email: data.email,
        name: data.name,
        role: data.role,
        avatar: data.avatar,
        title: data.title,
        bio: data.bio,
        socialLinks: data.social_links || {},
        firstLogin: data.first_login
    }
}

// ============ BOOKS ============
export async function updateBookStatus(bookId, newStatus) {
    const { error } = await supabase
        .from('books')
        .update({ status: newStatus })
        .eq('id', bookId)
    return !error
}

export async function updateBook(bookId, updates) {
    const dbUpdates = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo
    if (updates.royaltyPercent !== undefined) dbUpdates.royalty_percent = updates.royaltyPercent
    if (updates.advance !== undefined) dbUpdates.advance = updates.advance
    if (updates.pvp !== undefined) dbUpdates.pvp = updates.pvp
    if (updates.contractExpiry !== undefined) dbUpdates.contract_expiry = updates.contractExpiry
    if (updates.synopsis !== undefined) dbUpdates.synopsis = updates.synopsis
    if (updates.genre !== undefined) dbUpdates.genre = updates.genre
    if (updates.isbn !== undefined) dbUpdates.isbn = updates.isbn
    if (updates.tiraje !== undefined) dbUpdates.tiraje = updates.tiraje
    if (updates.escandalloCosts !== undefined) dbUpdates.escandallo_costs = updates.escandalloCosts
    if (updates.width !== undefined) dbUpdates.width = updates.width
    if (updates.height !== undefined) dbUpdates.height = updates.height
    if (updates.pages !== undefined) dbUpdates.pages = updates.pages
    if (updates.coverType !== undefined) dbUpdates.cover_type = updates.coverType
    if (updates.flaps !== undefined) dbUpdates.flaps = updates.flaps
    if (updates.interiorPaper !== undefined) dbUpdates.interior_paper = updates.interiorPaper
    if (updates.coverPaper !== undefined) dbUpdates.cover_paper = updates.coverPaper
    if (updates.coverFinish !== undefined) dbUpdates.cover_finish = updates.coverFinish
    if (updates.cover !== undefined) dbUpdates.cover = updates.cover

    const { error } = await supabase
        .from('books')
        .update(dbUpdates)
        .eq('id', bookId)
    return !error
}

export async function deleteBook(bookId) {
    const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId)
    return !error
}

// ============ DOCUMENTS ============
export async function addDocumentEntry(doc) {
    const { error } = await supabase
        .from('documents')
        .insert({
            id: doc.id,
            tenant_id: doc.tenantId,
            book_id: doc.bookId,
            name: doc.name,
            type: doc.type,
            file_url: doc.fileUrl,
            size: doc.size,
            amount: doc.amount,
            uploaded_by: doc.uploadedBy
        })
    return !error
}

export async function updateDocumentEntry(docId, updates) {
    const dbUpdates = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.bookId !== undefined) dbUpdates.book_id = updates.bookId
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount

    const { error } = await supabase
        .from('documents')
        .update(dbUpdates)
        .eq('id', docId)

    if (error) console.error('Error updating document:', error)
    return !error
}

export async function deleteDocumentEntry(docId, fileUrl) {
    if (fileUrl) {
        try {
            // The file path in the bucket is everything after the bucket name
            const pathParts = fileUrl.split('editorial_documents/')
            if (pathParts.length > 1) {
                const filePath = pathParts.pop()
                if (filePath) {
                    await supabase.storage.from('editorial_documents').remove([filePath])
                }
            }
        } catch (e) {
            console.error('Failed to delete file from storage', e)
        }
    }
    const { error } = await supabase.from('documents').delete().eq('id', docId)
    if (error) console.error('Error deleting document DB entry:', error)
    return !error
}

// ============ AUDIT LOG ============
export async function addAuditLogEntry(entry) {
    const { error } = await supabase
        .from('audit_log')
        .insert({
            id: entry.id,
            tenant_id: entry.tenantId,
            date: entry.date,
            user_id: entry.userId,
            user_name: entry.userName,
            action: entry.action,
            type: entry.type
        })
    return !error
}

// ============ COMMENTS ============
export async function addCommentEntry(comment) {
    const { error } = await supabase
        .from('comments')
        .insert({
            id: comment.id,
            tenant_id: comment.tenantId,
            book_id: comment.bookId,
            user_id: comment.userId,
            user_name: comment.userName,
            role: comment.role,
            text: comment.text,
            date: comment.date,
            category: comment.category
        })
    return !error
}

// ============ INVENTORY ============
export async function updateInventoryPhysical(bookId, updates) {
    const { error } = await supabase
        .from('inventory_physical')
        .update({
            stock: updates.stock,
            entries: updates.entries,
            exits: updates.exits
        })
        .eq('book_id', bookId)
    return !error
}

// ============ INVOICES ============
export async function addInvoice(invoice) {
    const { error } = await supabase
        .from('invoices')
        .insert({
            id: invoice.id,
            tenant_id: invoice.tenantId,
            book_id: invoice.bookId,
            type: invoice.type,
            concept: invoice.concept,
            amount: invoice.amount,
            provider: invoice.provider,
            date: invoice.date,
            status: invoice.status
        })
    return !error
}

// ============ ALERTS ============
export async function markAlertRead(alertId) {
    const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId)
    return !error
}

export async function markAllAlertsRead() {
    const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('read', false)
    return !error
}

// ============ USER UPDATES ============
export async function updateUserFirstLogin(userId) {
    const { error } = await supabase
        .from('users')
        .update({ first_login: false })
        .eq('id', userId)
    return !error
}

export async function updateUserProfile(userId, updates) {
    const { error } = await supabase
        .from('users')
        .update({
            name: updates.name,
            bio: updates.bio,
            social_links: updates.socialLinks
        })
        .eq('id', userId)
    return !error
}

// ============ ADD BOOK ============
export async function addBook(book) {
    const { error } = await supabase
        .from('books')
        .insert({
            id: book.id,
            tenant_id: book.tenantId,
            title: book.title,
            author_id: book.authorId,
            author_name: book.authorName,
            isbn: book.isbn,
            genre: book.genre,
            status: book.status,
            assigned_to: book.assignedTo || [],
            royalty_percent: book.royaltyPercent,
            advance: book.advance,
            pvp: book.pvp,
            contract_expiry: book.contractExpiry,
            created_at: book.createdAt,
            cover: book.cover,
            synopsis: book.synopsis,
            width: book.width,
            height: book.height,
            pages: book.pages,
            cover_type: book.coverType,
            flaps: book.flaps,
            interior_paper: book.interiorPaper,
            cover_paper: book.coverPaper,
            cover_finish: book.coverFinish
        })
    if (error) console.error('Error adding book:', error)
    return !error
}

// ============ INVENTORY UPSERT ============
export async function upsertInventoryPhysical(bookId, updates) {
    // Try update first
    const { data, error: selectErr } = await supabase
        .from('inventory_physical')
        .select('id')
        .eq('book_id', bookId)

    if (data && data.length > 0) {
        const { error } = await supabase
            .from('inventory_physical')
            .update({
                stock: updates.stock,
                min_stock: updates.minStock,
                entries: updates.entries,
                exits: updates.exits
            })
            .eq('book_id', bookId)
        return !error
    } else {
        const { error } = await supabase
            .from('inventory_physical')
            .insert({
                tenant_id: updates.tenantId,
                book_id: bookId,
                stock: updates.stock,
                min_stock: updates.minStock || 100,
                entries: updates.entries || [],
                exits: updates.exits || []
            })
        return !error
    }
}

// ============ ROYALTY STATUS ============
export async function updateRoyaltyStatus(royaltyId, newStatus) {
    const { error } = await supabase
        .from('royalties')
        .update({ status: newStatus })
        .eq('id', royaltyId)
    return !error
}

// ============ DATA SYNC ============
export async function saveFullData(data) {
    try {
        for (const book of data.books) {
            await supabase.from('books').upsert({
                id: book.id,
                tenant_id: book.tenantId, // Requires tenantId to be present on book
                title: book.title,
                author_id: book.authorId,
                author_name: book.authorName,
                isbn: book.isbn,
                genre: book.genre,
                status: book.status,
                assigned_to: book.assignedTo,
                royalty_percent: book.royaltyPercent,
                advance: book.advance,
                pvp: book.pvp,
                contract_expiry: book.contractExpiry,
                created_at: book.createdAt,
                cover: book.cover,
                synopsis: book.synopsis
            })
        }
        return true
    } catch (err) {
        console.error('Failed to save data to Supabase:', err)
        return false
    }
}

// ============ USER MANAGEMENT ============
export async function addUser(user) {
    const { error } = await supabase
        .from('users')
        .insert({
            id: user.id,
            tenant_id: user.tenantId,
            email: user.email,
            password: user.password,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            title: user.title,
            bio: user.bio || null,
            social_links: user.socialLinks || {},
            first_login: user.firstLogin !== undefined ? user.firstLogin : true
        })
    if (error) console.error('Error adding user:', error)
    return !error
}

export async function updateUser(userId, updates) {
    const mapped = {}
    if (updates.name !== undefined) mapped.name = updates.name
    if (updates.email !== undefined) mapped.email = updates.email
    if (updates.password !== undefined) mapped.password = updates.password
    if (updates.role !== undefined) mapped.role = updates.role
    if (updates.title !== undefined) mapped.title = updates.title
    if (updates.bio !== undefined) mapped.bio = updates.bio
    if (updates.avatar !== undefined) mapped.avatar = updates.avatar
    if (updates.socialLinks !== undefined) mapped.social_links = updates.socialLinks

    const { error } = await supabase
        .from('users')
        .update(mapped)
        .eq('id', userId)
    if (error) console.error('Error updating user:', error)
    return !error
}

export async function deleteUser(userId) {
    // Delete related data first
    await supabase.from('comments').delete().eq('user_id', userId)
    await supabase.from('audit_log').delete().eq('user_id', userId)

    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
    if (error) console.error('Error deleting user:', error)
    return !error
}

// ============ SAAS ONBOARDING ============
export async function createSaaSTenant(formData) {
    const tenantId = `t${Date.now()}`
    const userId = `u${Date.now()}`

    // 1. Create Tenant
    const { error: tenantErr } = await supabase
        .from('tenants')
        .insert({
            id: tenantId,
            name: formData.editorialName,
            plan: formData.plan
        })

    if (tenantErr) {
        console.error('Error creating tenant:', tenantErr)
        return { success: false, error: 'No se pudo crear el Workspace.' }
    }

    // 2. Create Admin User
    const { error: userErr } = await supabase
        .from('users')
        .insert({
            id: userId,
            tenant_id: tenantId,
            email: formData.adminEmail,
            password: formData.password,
            name: formData.adminName,
            role: 'ADMIN',
            avatar: formData.adminName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
            title: 'Administrador SaaS',
            first_login: false
        })

    if (userErr) {
        console.error('Error creating admin user:', userErr)
        return { success: false, error: 'No se pudo crear el usuario administrador.' }
    }

    return { success: true, tenantId, userId }
}

// ============ RESET DEMO DATA ============
export async function resetTenantData(tenantId, adminUserId) {
    if (!tenantId || !adminUserId) return false

    try {
        // Delete all data associated with this tenant
        // Notice: Supabase ON DELETE CASCADE requires careful order, or simply dropping by tenant_id
        await supabase.from('inventory_physical').delete().eq('tenant_id', tenantId)
        await supabase.from('inventory_digital').delete().eq('tenant_id', tenantId)
        await supabase.from('invoices').delete().eq('tenant_id', tenantId)
        await supabase.from('royalties').delete().eq('tenant_id', tenantId)
        await supabase.from('comments').delete().eq('tenant_id', tenantId)
        await supabase.from('alerts').delete().eq('tenant_id', tenantId)

        // Books should be deleted after inventory (though CASCADE might cover it, it's safer to be explicit)
        await supabase.from('books').delete().eq('tenant_id', tenantId)

        // Delete audit log
        await supabase.from('audit_log').delete().eq('tenant_id', tenantId)

        // Delete all users EXCEPT the admin user initiating the reset
        await supabase.from('users').delete().eq('tenant_id', tenantId).neq('id', adminUserId)

        return true
    } catch (err) {
        console.error('Error resetting tenant data:', err)
        return false
    }
}
