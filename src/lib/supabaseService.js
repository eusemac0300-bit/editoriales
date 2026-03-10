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
            { data: documents, error: docsErr },
            { data: quotes, error: quotesErr },
            { data: sales, error: salesErr },
            { data: consignments, error: consignmentsErr },
            { data: suppliers, error: suppliersErr },
            { data: purchaseOrders, error: poErr },
            { data: expenses, error: expErr }
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
            supabase.from('documents').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
            supabase.from('quotes').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
            supabase.from('sales').select('*, books(title)').eq('tenant_id', tenantId).order('sale_date', { ascending: false }),
            supabase.from('consignments').select('*, books(title)').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
            supabase.from('suppliers').select('*').eq('tenant_id', tenantId).order('name', { ascending: true }),
            supabase.from('purchase_orders').select('*, books(title), suppliers(name)').eq('tenant_id', tenantId).order('date_ordered', { ascending: false }),
            supabase.from('expenses').select('*, suppliers(name)').eq('tenant_id', tenantId).order('date', { ascending: false })
        ])

        const criticalErrors = [usersErr, booksErr, invPhysErr, invoicesErr, auditErr, commentsErr].filter(Boolean)
        if (criticalErrors.length > 0) {
            console.error('Supabase critical load errors:', criticalErrors)
            return null
        }

        const nonCriticalErrors = [invDigErr, royaltiesErr, alertsErr, docsErr, quotesErr, salesErr, consignmentsErr, suppliersErr, poErr, expErr].filter(Boolean)
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
            pagesColor: b.pages_color || '',
            sku: b.sku || '',
            hasLegalDeposit: b.has_legal_deposit || 'No',
            legalDepositNumber: b.legal_deposit_number || '',
            coverType: b.cover_type || '',
            flaps: b.flaps || '',
            flapWidth: b.flap_width || '',
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
            id: p.id,
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

        // Transform royalties (new schema connected to sales)
        const transformedRoyalties = (royalties || []).map(r => ({
            id: r.id,
            authorId: r.author_id,
            authorName: r.author_name || '',
            bookId: r.book_id,
            period: r.period,
            periodStart: r.period_start,
            periodEnd: r.period_end,
            totalSalesAmount: r.total_sales_amount || 0,
            totalUnitsSold: r.total_units_sold || 0,
            royaltyPercent: r.royalty_percent || 0,
            grossRoyalty: r.gross_royalty || 0,
            advanceDeducted: r.advance_deducted || 0,
            netRoyalty: r.net_royalty || 0,
            status: r.status || 'pendiente',
            approvedAt: r.approved_at,
            paidAt: r.paid_at,
            notes: r.notes || '',
            createdAt: r.created_at
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

        const transformedQuotes = (quotes || []).map(q => ({
            id: q.id,
            bookId: q.book_id,
            provider: q.provider,
            requestedAmount: q.requested_amount,
            requestedAmount2: q.requested_amount_2,
            requestedAmount3: q.requested_amount_3,
            requestedAmount4: q.requested_amount_4,
            bindingType: q.binding_type,
            extraFinishes: q.extra_finishes,
            status: q.status,
            quotedAmount: q.quoted_amount,
            deliveryDate: q.delivery_date,
            notes: q.notes,
            bookTitle: q.book_title,
            bookWidth: q.book_width,
            bookHeight: q.book_height,
            bookPagesBw: q.book_pages_bw,
            bookPagesColor: q.book_pages_color,
            bookCoverType: q.book_cover_type,
            bookFlaps: q.book_flaps,
            bookFlapWidth: q.book_flap_width,
            bookInteriorPaper: q.book_interior_paper,
            bookCoverPaper: q.book_cover_paper,
            bookCoverFinish: q.book_cover_finish,
            approvedAmount: q.approved_amount,
            quotedAmount2: q.quoted_amount_2,
            quotedAmount3: q.quoted_amount_3,
            quotedAmount4: q.quoted_amount_4,
            createdAt: q.created_at,
            updatedAt: q.updated_at
        }))
        const transformedSales = (sales || []).map(s => ({
            id: s.id,
            tenantId: s.tenant_id,
            bookId: s.book_id,
            bookTitle: s.book_title || s.books?.title || '',
            channel: s.channel,
            type: s.type,
            quantity: s.quantity,
            unitPrice: s.unit_price,
            totalAmount: s.total_amount,
            neto: s.neto || 0,
            iva: s.iva || 0,
            saleDate: s.sale_date,
            clientName: s.client_name,
            documentRef: s.document_ref,
            status: s.status,
            notes: s.notes,
            createdAt: s.created_at,
            updatedAt: s.updated_at
        }))

        // Transform consignments
        const transformedConsignments = (consignments || []).map(c => ({
            id: c.id,
            bookId: c.book_id,
            bookTitle: c.books?.title || '',
            clientName: c.client_name,
            contactInfo: c.contact_info,
            sentDate: c.sent_date,
            sentQuantity: c.sent_quantity || 0,
            soldQuantity: c.sold_quantity || 0,
            returnedQuantity: c.returned_quantity || 0,
            status: c.status,
            notes: c.notes,
            createdAt: c.created_at,
            updatedAt: c.updated_at
        }))

        const transformedExpenses = (expenses || []).map(e => ({
            ...e,
            supplierName: e.suppliers?.name || 'Proveedor Directo'
        }))

        const transformedPurchaseOrders = (purchaseOrders || []).map(po => ({
            ...po,
            bookTitle: po.books?.title || 'Libro Desconocido',
            supplierName: po.suppliers?.name || 'Proveedor Desconocido'
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
                royalties: transformedRoyalties,
                sales: transformedSales,
                consignments: transformedConsignments,
                expenses: transformedExpenses
            },
            auditLog: transformedAudit,
            comments: transformedComments,
            alerts: transformedAlerts,
            documents: transformedDocuments,
            quotes: transformedQuotes,
            suppliers: suppliers || [],
            purchaseOrders: transformedPurchaseOrders
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
    if (updates.flapWidth !== undefined) dbUpdates.flap_width = updates.flapWidth
    if (updates.interiorPaper !== undefined) dbUpdates.interior_paper = updates.interiorPaper
    if (updates.coverPaper !== undefined) dbUpdates.cover_paper = updates.coverPaper
    if (updates.coverFinish !== undefined) dbUpdates.cover_finish = updates.coverFinish
    if (updates.cover !== undefined) dbUpdates.cover = updates.cover
    if (updates.pagesColor !== undefined) dbUpdates.pages_color = updates.pagesColor
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku
    if (updates.hasLegalDeposit !== undefined) dbUpdates.has_legal_deposit = updates.hasLegalDeposit
    if (updates.legalDepositNumber !== undefined) dbUpdates.legal_deposit_number = updates.legalDepositNumber

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
            flap_width: book.flapWidth,
            interior_paper: book.interiorPaper,
            cover_paper: book.coverPaper,
            cover_finish: book.coverFinish,
            pages_color: book.pagesColor,
            sku: book.sku,
            has_legal_deposit: book.hasLegalDeposit,
            legal_deposit_number: book.legalDepositNumber
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
            bio: user.bio ? (typeof user.bio === 'string' ? user.bio : JSON.stringify(user.bio)) : null,
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
    if (updates.bio !== undefined) mapped.bio = typeof updates.bio === 'string' ? updates.bio : JSON.stringify(updates.bio)
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

// ============ QUOTES ============
export async function addQuoteToDb(quote) {
    const { error } = await supabase
        .from('quotes')
        .insert({
            id: quote.id,
            tenant_id: quote.tenantId,
            book_id: quote.bookId,
            provider: quote.provider,
            requested_amount: quote.requestedAmount,
            requested_amount_2: quote.requestedAmount2 || 0,
            requested_amount_3: quote.requestedAmount3 || 0,
            requested_amount_4: quote.requestedAmount4 || 0,
            binding_type: quote.bindingType,
            extra_finishes: quote.extraFinishes,
            status: quote.status,
            quoted_amount: quote.quotedAmount,
            quoted_amount_2: quote.quotedAmount2 || 0,
            quoted_amount_3: quote.quotedAmount3 || 0,
            quoted_amount_4: quote.quotedAmount4 || 0,
            delivery_date: quote.deliveryDate,
            notes: quote.notes,
            book_title: quote.bookTitle,
            book_width: quote.bookWidth,
            book_height: quote.bookHeight,
            book_pages_bw: quote.bookPagesBw,
            book_pages_color: quote.bookPagesColor,
            book_cover_type: quote.bookCoverType,
            book_flaps: quote.bookFlaps,
            book_flap_width: quote.bookFlapWidth,
            book_interior_paper: quote.bookInteriorPaper,
            book_cover_paper: quote.bookCoverPaper,
            book_cover_finish: quote.bookCoverFinish,
            approved_amount: quote.approvedAmount || null,
            created_at: quote.createdAt,
            updated_at: quote.updatedAt
        })
    if (error) console.error('Error adding quote:', error)
    return !error
}

export async function updateQuoteInDb(quoteId, updates) {
    const dbUpdates = {}
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.quotedAmount !== undefined) dbUpdates.quoted_amount = updates.quotedAmount
    if (updates.quotedAmount2 !== undefined) dbUpdates.quoted_amount_2 = updates.quotedAmount2
    if (updates.quotedAmount3 !== undefined) dbUpdates.quoted_amount_3 = updates.quotedAmount3
    if (updates.quotedAmount4 !== undefined) dbUpdates.quoted_amount_4 = updates.quotedAmount4
    if (updates.deliveryDate !== undefined) dbUpdates.delivery_date = updates.deliveryDate
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.provider !== undefined) dbUpdates.provider = updates.provider
    if (updates.requestedAmount !== undefined) dbUpdates.requested_amount = updates.requestedAmount
    if (updates.requestedAmount2 !== undefined) dbUpdates.requested_amount_2 = updates.requestedAmount2
    if (updates.requestedAmount3 !== undefined) dbUpdates.requested_amount_3 = updates.requestedAmount3
    if (updates.requestedAmount4 !== undefined) dbUpdates.requested_amount_4 = updates.requestedAmount4
    if (updates.bindingType !== undefined) dbUpdates.binding_type = updates.bindingType
    if (updates.extraFinishes !== undefined) dbUpdates.extra_finishes = updates.extraFinishes
    if (updates.approvedAmount !== undefined) dbUpdates.approved_amount = updates.approvedAmount
    dbUpdates.updated_at = new Date().toISOString()

    const { error } = await supabase
        .from('quotes')
        .update(dbUpdates)
        .eq('id', quoteId)
    if (error) console.error('Error updating quote:', error)
    return !error
}

export async function deleteQuoteFromDb(quoteId) {
    const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId)
    if (error) console.error('Error deleting quote:', error)
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

// ============ SALES ============
export async function addSaleToDb(sale) {
    const { error } = await supabase
        .from('sales')
        .insert({
            id: sale.id,
            tenant_id: sale.tenantId,
            book_id: sale.bookId,
            book_title: sale.bookTitle || '',
            channel: sale.channel,
            type: sale.type,
            quantity: sale.quantity,
            unit_price: sale.unitPrice,
            total_amount: sale.totalAmount,
            neto: sale.neto || 0,
            iva: sale.iva || 0,
            sale_date: sale.saleDate,
            client_name: sale.clientName,
            document_ref: sale.documentRef,
            status: sale.status,
            notes: sale.notes,
            created_at: sale.createdAt,
            updated_at: sale.updatedAt || sale.createdAt
        })
    if (error) console.error('Error adding sale:', error)
    return !error
}

export async function updateSaleInDb(saleId, updates) {
    const dbUpdates = {}
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    dbUpdates.updated_at = new Date().toISOString()

    const { error } = await supabase
        .from('sales')
        .update(dbUpdates)
        .eq('id', saleId)
    if (error) console.error('Error updating sale:', error)
    return !error
}

export async function deleteSaleFromDb(saleId) {
    const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId)
    if (error) console.error('Error deleting sale:', error)
    return !error
}
// ============ SUPPLIERS ============
export async function addSupplierToDb(tenantId, supplierData) {
    const { data, error } = await supabase
        .from('suppliers')
        .insert([{ ...supplierData, tenant_id: tenantId }])
        .select()
    if (error) throw error
    return data[0]
}

export async function updateSupplierInDb(supplierId, supplierData) {
    const { data, error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', supplierId)
        .select()
    if (error) throw error
    return data[0]
}

export async function deleteSupplierFromDb(supplierId) {
    const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId)
    if (error) throw error
    return true
}

// ============ PURCHASE ORDERS ============
export async function addPurchaseOrderToDb(tenantId, poData) {
    const { data, error } = await supabase
        .from('purchase_orders')
        .insert([{ ...poData, tenant_id: tenantId }])
        .select()
    if (error) throw error
    return data[0]
}

export async function updatePurchaseOrderInDb(poId, poData) {
    const { data, error } = await supabase
        .from('purchase_orders')
        .update(poData)
        .eq('id', poId)
        .select()
    if (error) throw error
    return data[0]
}

export async function deletePurchaseOrderFromDb(poId) {
    const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', poId)
    if (error) throw error
    return true
}

export async function receivePurchaseOrderInDb(poId, quantity, bookId, tenantId) {
    // 1. Update PO status and received quantity
    const { data: po, error: poErr } = await supabase
        .from('purchase_orders')
        .update({
            status: 'RECIBIDA',
            received_quantity: quantity
        })
        .eq('id', poId)
        .select()
        .single()

    if (poErr) throw poErr

    // 2. Update physical inventory
    const { data: inv, error: invErr } = await supabase
        .from('inventory_physical')
        .select('*')
        .eq('book_id', bookId)
        .eq('tenant_id', tenantId)
        .single()

    if (invErr && invErr.code !== 'PGRST116') throw invErr

    if (inv) {
        const { error: upErr } = await supabase
            .from('inventory_physical')
            .update({ stock: inv.stock + quantity })
            .eq('id', inv.id)
        if (upErr) throw upErr
    } else {
        const { error: insErr } = await supabase
            .from('inventory_physical')
            .insert([{
                book_id: bookId,
                tenant_id: tenantId,
                stock: quantity,
                min_stock: 10
            }])
        if (insErr) throw insErr
    }

    return po
}

// ============ EXPENSES ============
export async function addExpenseToDb(tenantId, expenseData) {
    const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expenseData, tenant_id: tenantId }])
        .select()
    if (error) throw error
    return data[0]
}

export async function updateExpenseInDb(expenseId, expenseData) {
    const { data, error } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', expenseId)
        .select()
    if (error) throw error
    return data[0]
}

export async function deleteExpenseFromDb(expenseId) {
    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
    if (error) throw error
    return true
}
