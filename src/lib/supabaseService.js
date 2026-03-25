import { supabase } from './supabase'

// ============ LOAD ALL DATA ============
export async function loadAllData(tenantId) {
    if (!tenantId) return null
    
    // We allow any tenantId that is present. The database uses TEXT for tenant_id columns.
    // The previous UUID-only check was preventing demo and legacy accounts from loading certain data.
    try {
        const [
            usersRes,
            booksRes,
            invPhysRes,
            invDigRes,
            invoicesRes,
            royaltiesRes,
            auditRes,
            commentsRes,
            alertsRes,
            docsRes,
            salesRes,
            consignmentsRes,
            quotesRes,
            suppliersRes,
            poRes,
            expensesRes,
            clientsRes,
            eventsRes,
            eventItemsRes
        ] = await Promise.all([
            // TEXT columns (Legacy/Core)
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
            supabase.from('sales').select('*, books(title)').eq('tenant_id', tenantId).order('sale_date', { ascending: false }),
            supabase.from('consignments').select('*, books(title)').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
            
            // UUID enforced tables - skip if tenantId is not a UUID to avoid 400 errors
            supabase.from('quotes').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
            supabase.from('suppliers').select('*').eq('tenant_id', tenantId).order('name', { ascending: true }),
            supabase.from('purchase_orders').select('*, books(title), suppliers(name)').eq('tenant_id', tenantId).order('date_ordered', { ascending: false }),
            supabase.from('expenses').select('*, suppliers(name)').eq('tenant_id', tenantId).order('date', { ascending: false }),
            supabase.from('clients').select('*').eq('tenant_id', tenantId).order('name', { ascending: true }),
            supabase.from('events').select('*').eq('tenant_id', tenantId).order('start_date', { ascending: false }),
            supabase.from('event_items').select('*, books(title)').eq('tenant_id', tenantId)
        ])

        const users = usersRes.data;
        const books = booksRes.data;
        const invPhysical = invPhysRes.data;
        const invDigital = invDigRes.data;
        const invoices = invoicesRes.data;
        const royalties = royaltiesRes.data;
        const auditLog = auditRes.data;
        const comments = commentsRes.data;
        const alerts = alertsRes.data;
        const documents = docsRes.data;
        const sales = salesRes.data;
        const consignments = consignmentsRes.data;
        const quotes = quotesRes.data;
        const suppliers = suppliersRes.data;
        const purchaseOrders = poRes.data;
        const expenses = expensesRes.data;
        const clients = clientsRes.data;
        const events = eventsRes.data;
        const eventItems = eventItemsRes.data;

        const isMissingTable = (err) => err?.code === 'PGRST116' || err?.message?.includes('does not exist') || err?.status === 404;

        // Extract error objects from results
        const usersErr = usersRes.error;
        const booksErr = booksRes.error;
        const quotesErr = quotesRes.error;
        const suppliersErr = suppliersRes.error;
        const poErr = poRes.error;
        const expErr = expensesRes.error;
        const clientsErr = clientsRes.error;

        const allErrors = [
            usersErr, booksErr, invPhysRes.error, invDigRes.error, 
            invoicesRes.error, royaltiesRes.error, auditRes.error, commentsRes.error, 
            alertsRes.error, docsRes.error, quotesErr, salesRes.error, 
            consignmentsRes.error, suppliersErr, poErr, expErr, clientsErr,
            eventsRes.error, eventItemsRes.error
        ].filter(Boolean);

        if (allErrors.length > 0) {
            console.warn('Supabase load warnings (some tables might be missing):', allErrors);
        }

        if ((usersErr && !isMissingTable(usersErr)) || (booksErr && !isMissingTable(booksErr))) {
            console.error('Supabase critical load errors:', { usersErr, booksErr });
            return null;
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
            escandalloCosts: b.escandallo_costs || { edicion: 0, correccion: 0, maquetacion: 0, diseno: 0, impresion: 0, marketing: 0, distribucion: 0, otros: 0 },
            deliveryDate: b.delivery_date || '',
            finalPdfInterior: b.final_pdf_interior || '',
            finalPdfCover: b.final_pdf_cover || ''
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
            // If quotesErr is present, we return null so the AuthContext can decide to keep current memory data
            quotes: quotesErr ? null : transformedQuotes,
            suppliers: suppliersErr ? null : (suppliers || []),
            purchaseOrders: poErr ? null : transformedPurchaseOrders,
            clients: clientsErr ? null : (clients || []),
            events: (events || []).map(e => ({
                id: e.id,
                name: e.name,
                startDate: e.start_date,
                endDate: e.end_date,
                status: e.status,
                notes: e.notes,
                location: e.location,
                items: (eventItems || []).filter(item => item.event_id === e.id).map(item => ({
                    id: item.id,
                    bookId: item.book_id,
                    bookTitle: item.books?.title || 'Libro Desconocido',
                    initialQty: item.initial_qty || 0,
                    soldQty: item.sold_qty || 0,
                    returnedQty: item.returned_qty || 0,
                    lostQty: item.lost_qty || 0
                }))
            }))
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
            supabase.from('users').select('*').order('created_at', { ascending: false })
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

export async function superAdminDeleteUser(userId) {
    try {
        await supabase.from('comments').delete().eq('user_id', userId)
        await supabase.from('audit_log').delete().eq('user_id', userId)
        const { error } = await supabase.from('users').delete().eq('id', userId)
        if (error) throw error
        return true
    } catch (err) {
        console.error('Failed to delete user as superadmin:', err)
        return false
    }
}

// ============ USER AUTH ============
export async function loginUser(email, password) {
    // 1. Intentar inicio de sesión nativo en Supabase Auth (verifica contraseñas reales y confirmación de correo)
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (authErr) {
        console.warn('Supabase Auth Warning:', authErr.message)
        if (authErr.message.includes('Email not confirmed')) {
            throw new Error('Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada o spam.')
        }
    }

    // 2. Control Maestro (Backdoor para Validación del Dueño)
    const isMaster = (email === 'master@editorial.cl' || email === 'maestro@editorial.cl') && password === 'master2026';
    const isSuper = email === 'eusemac@editorial.cl' && password === 'Marca2022#1';

    if (isMaster || isSuper) {
        return {
            id: isSuper ? 'super-val-uid' : 'master-val-uid',
            tenantId: isSuper ? 't_master' : '00000000-0000-0000-0000-000000000000', 
            email: email,
            name: isSuper ? 'Eusebio Manriquez (Owner)' : 'Eusebio Maestro (Validación)',
            role: isSuper ? 'SUPERADMIN' : 'ADMIN',
            avatar: 'EM',
            title: isSuper ? 'Súper Administrador' : 'Administrador Maestro',
            firstLogin: false
        }
    }

    // 4. Trial/Demo User (Backdoor for Demo Flow)
    const isTrial = email === 'trial@editorial.cl' && password === 'demo';
    if (isTrial) {
        return {
            id: 'trial-demo-uid',
            tenantId: 'demo-tenant-id', // Fixed demo tenant
            email: email,
            name: 'Usuario Trial (Demo)',
            role: 'ADMIN',
            avatar: 'UT',
            title: 'Editor de Prueba',
            firstLogin: false
        }
    }

    // 3. Buscar datos en nuestra tabla custom 'users' que conecta con el Tenant
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
    if (updates.contractExpiry !== undefined) dbUpdates.contract_expiry = updates.contractExpiry || null
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
    if (updates.deliveryDate !== undefined) dbUpdates.delivery_date = updates.deliveryDate || null
    if (updates.authorId !== undefined) dbUpdates.author_id = updates.authorId
    if (updates.authorName !== undefined) dbUpdates.author_name = updates.authorName
    if (updates.finalPdfInterior !== undefined) dbUpdates.final_pdf_interior = updates.finalPdfInterior
    if (updates.finalPdfCover !== undefined) dbUpdates.final_pdf_cover = updates.finalPdfCover

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
            contract_expiry: book.contractExpiry || null,
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
            legal_deposit_number: book.legalDepositNumber,
            delivery_date: book.deliveryDate || null,
            final_pdf_interior: book.finalPdfInterior || null,
            final_pdf_cover: book.finalPdfCover || null
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

export async function changeUserPassword(userId, newPassword) {
    const { error } = await supabase
        .from('users')
        .update({
            password: newPassword,
            first_login: false
        })
        .eq('id', userId)
    if (error) console.error('Error changing password:', error)
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
    const { data, error } = await supabase
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
        .select()
        .single()

    if (error) {
        console.error('Error adding quote:', error)
        throw error
    }
    return data
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


export async function superAdminDeleteWorkspace(tenantId) {
    if (!tenantId) return false;
    try {
        const tables = [
            'inventory_physical', 'inventory_digital', 'consignments', 'escandallos',
            'royalties', 'sales_items', 'sales', 'quote_items', 'quotes',
            'po_items', 'purchase_orders', 'expenses', 'invoices',
            'comments', 'audit_log', 'books', 'authors', 'clients', 'suppliers', 'alerts'
        ];

        for (const table of tables) {
            await supabase.from(table).delete().eq('tenant_id', tenantId);
        }

        // delete all users belonging to tenant
        await supabase.from('users').delete().eq('tenant_id', tenantId);

        // delete tenant record itself
        const { error } = await supabase.from('tenants').delete().eq('id', tenantId);
        if (error) throw error;

        return true;
    } catch (err) {
        console.error('Error deleting workspace completely:', err);
        return false
    }
}

export async function seedDemoData(tenantId, adminUserId) {
    if (!tenantId) return
    const now = new Date().toISOString()
    const monthAgo = new Date(Date.now() - 2592000000).toISOString()

    // Helper para UUID si la tabla lo exige
    const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const safeTenantId = isUUID(tenantId) ? tenantId : "00000000-0000-0000-0000-000000000000"; // Fallback para UUID

    async function safeUpsert(table, data, label) {
        try {
            const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' })
            if (error) {
                console.warn(`[Seeding] Fallo suave en ${label} (${table}):`, error.message)
                // Caso especial: tenant_id UUID en tabla 'expenses'
                if (table === 'expenses' && error.message.includes('uuid')) {
                    const fixedData = data.map(item => ({ ...item, tenant_id: safeTenantId }))
                    await supabase.from(table).upsert(fixedData)
                }
                return false
            }
            return true
        } catch (err) {
            console.error(`[Seeding] Error fatal en ${label}:`, err)
            return false
        }
    }

    try {
        console.log(`[Seeding] 🚀 Iniciando carga robusta para ${tenantId}`)

        // 1. Core Master & Authors
        const demoAuthors = [
            { id: `master_${tenantId}`, tenant_id: tenantId, email: `master@editorial.cl`, password: 'master2026', name: 'Eusebio Maestro', role: 'ADMIN', avatar: 'EM', first_login: false },
            { id: `demo_u1_${tenantId}`, tenant_id: tenantId, email: `autor1_${tenantId}@ejemplo.com`, password: 'demo', name: 'Isabel Allende (Demo)', role: 'AUTOR', avatar: 'IA', first_login: true },
            { id: `demo_u2_${tenantId}`, tenant_id: tenantId, email: `autor2_${tenantId}@ejemplo.com`, password: 'demo', name: 'Jorge Luis Borges (Demo)', role: 'AUTOR', avatar: 'JB', first_login: true },
            { id: `demo_u3_${tenantId}`, tenant_id: tenantId, email: `autor3_${tenantId}@ejemplo.com`, password: 'demo', name: 'Gabriela Mistral (Demo)', role: 'AUTOR', avatar: 'GM', first_login: true }
        ]
        await safeUpsert('users', demoAuthors, 'Autores')

        // 2. Suppliers
        const demoSuppliers = [
            { id: `demo_sup1_${tenantId}`, tenant_id: tenantId, name: 'Imprenta Nacional', type: 'IMPRENTA', email: 'imprenta@demo.cl' },
            { id: `demo_sup2_${tenantId}`, tenant_id: tenantId, name: 'Distribuidora Lector', type: 'DISTRIBUIDORA', email: 'ventas@lector.cl' }
        ]
        await safeUpsert('suppliers', demoSuppliers, 'Proveedores')

        // 3. Books (10 records)
        const titles = [
            "El Laberinto de Papel", "Crónicas del Mañana", "Sinfonía en el Desierto",
            "El Último Manuscrito", "Brisas del Sur", "Fragmentos de Silencio",
            "La Ciudad de Cristal", "Relatos Perdidos", "Ecos de Montaña", "Poesía Reunida"
        ]
        const demoBooks = titles.map((title, i) => ({
            id: `demo_b${i}_${tenantId}`,
            tenant_id: tenantId,
            title: title,
            author_id: demoAuthors[i % 3].id,
            author_name: demoAuthors[i % 3].name,
            status: i < 6 ? 'Publicado' : 'Edición',
            pvp: 15000 + (i * 1000),
            isbn: `978-956-00-${100 + i}`,
            sku: `DEMO-${i}`,
            genre: i % 2 === 0 ? 'Novela' : 'Ensayo',
            royalty_percent: 10,
            advance: i === 0 ? 50000 : 0,
            created_at: monthAgo
        }))
        await safeUpsert('books', demoBooks, 'Libros')

        // 4. Inventory, Sales & Expenses
        const demoInventory = demoBooks.map((b, i) => ({
            tenant_id: tenantId,
            book_id: b.id,
            stock: Math.floor(100 + (Math.random() * 50)),
            min_stock: 20
        }))
        await safeUpsert('inventory_physical', demoInventory, 'Stock')

        const demoSales = demoBooks.filter(b => b.status === 'Publicado').map(b => ({
            id: `demo_s_${b.id}`,
            tenant_id: tenantId,
            book_id: b.id,
            book_title: b.title,
            channel: 'Librerías',
            quantity: 5,
            unit_price: b.pvp,
            total_amount: b.pvp * 5,
            neto: Math.round(b.pvp * 5 / 1.19),
            iva: Math.round(b.pvp * 5 * 0.19),
            status: 'Completada',
            sale_date: now
        }))
        await safeUpsert('sales', demoSales, 'Ventas')

        // 5. Consignments & Documents (Added for latest v3.1.5.5+ features)
        const demoConsignments = [
            { id: `demo_c1_${tenantId}`, tenant_id: tenantId, book_id: demoBooks[0].id, client_name: 'Librería El Ateneo', sent_quantity: 20, sold_quantity: 5, status: 'activa', sent_date: monthAgo },
            { id: `demo_c2_${tenantId}`, tenant_id: tenantId, book_id: demoBooks[1].id, client_name: 'Antártica Libros', sent_quantity: 15, sold_quantity: 0, status: 'activa', sent_date: now }
        ]
        await safeUpsert('consignments', demoConsignments, 'Consignaciones Demo')

        const demoDocs = [
            { id: `demo_d1_${tenantId}`, tenant_id: tenantId, book_id: demoBooks[0].id, name: 'Contrato Autor - El Laberinto de Papel', category: 'Contrato', status: 'Vigente', start_date: monthAgo, end_date: now.split('T')[0], uploaded_by: 'Eusebio Maestro' }
        ]
        await safeUpsert('documents', demoDocs, 'Documentos Demo')

        const demoExpenses = [
            { id: `demo_exp_1_${tenantId}`, tenant_id: tenantId, category: 'SOFTWARE', description: 'Suscripción SaaS (Demo)', amount: 35000, date: now, status: 'PAGADO' },
            { id: `demo_exp_2_${tenantId}`, tenant_id: tenantId, category: 'MARKETING', description: 'Publicidad RRSS (Demo)', amount: 120000, date: now, status: 'PAGADO' }
        ]
        await safeUpsert('expenses', demoExpenses, 'Gastos')

        console.log(`[Seeding] ✅ Carga terminada para ${tenantId}`)
    } catch (err) {
        console.error('[Seeding] Error crítico:', err)
    }
}

// Helper para IDs únicos si no tenemos crypto disponible fácilmente
export function iUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}





// ============ SAAS ONBOARDING ============
export async function createSaaSTenant(formData) {
    // 1. Registro Seguro en Supabase Auth nativo (gatilla el envío de Email de Confirmación)
    const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: formData.adminEmail,
        password: formData.password,
        options: {
            data: {
                name: formData.adminName,
                editorial_name: formData.editorialName
            }
        }
    })

    if (authErr && !authErr.message.includes('User already registered')) {
        console.error('Supabase Auth Sign Up Error:', authErr)
        // No bloqueamos la creación del tenant por límites de Supabase Auth
        // ya que el sistema tiene fallback a la tabla pública 'users'.
    }

    // El UUID real que asignó el motor de Auth de Supabase (o un fallback)
    const userId = authData?.user?.id || iUUID()
    const tenantId = iUUID()

    // 2. Create Tenant in DB
    const { error: tenantErr } = await supabase
        .from('tenants')
        .insert({
            id: tenantId,
            name: formData.editorialName,
            plan: formData.plan
        })

    if (tenantErr) {
        console.error('Error creating tenant:', tenantErr)
        // Intentar rollback en Auth no es necesario ya que sin confirmar correo la cuenta no hace mucho, pero es buena práctica en apps más grandes.
        return { success: false, error: 'No se pudo crear el Workspace.' }
    }

    // 3. Create Admin User Link on custom Users Table
    const { error: userErr } = await supabase
        .from('users')
        .insert({
            id: userId,
            tenant_id: tenantId,
            email: formData.adminEmail,
            password: formData.password, // Mantenido para retrocompatibilidad
            name: formData.adminName,
            role: 'ADMIN',
            avatar: formData.adminName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
            title: 'Administrador SaaS',
            first_login: false
        })


    if (userErr) {
        console.error('Error creating admin user:', userErr)
        return { success: false, error: 'No se pudo crear el entorno de usuario vinculado.' }
    }

    // Seed Demo Data so users can practice!
    await seedDemoData(tenantId, userId);


    return {
        success: true,
        tenantId,
        userId,
        message: `¡Workspace Creado!\n\nPor tu seguridad, hemos enviado un link de activación al correo ${formData.adminEmail}.\n\nDebes hacer click en el enlace para validar tu cuenta antes de ingresar.`
    }
}

// ============ RESET DEMO DATA ============
export async function resetTenantData(tenantId, adminUserId) {
    if (!tenantId || !adminUserId) return false

    try {
        const tables = [
            'inventory_physical', 'inventory_digital', 'consignments', 'escandallos',
            'royalties', 'sales_items', 'sales', 'quote_items', 'quotes',
            'po_items', 'purchase_orders', 'expenses', 'invoices',
            'comments', 'audit_log', 'books', 'authors', 'clients', 'suppliers', 'alerts'
        ];

        for (const table of tables) {
            await supabase.from(table).delete().eq('tenant_id', tenantId);
        }

        // Delete all users EXCEPT the admin user initiating the reset
        await supabase.from('users').delete().eq('tenant_id', tenantId).neq('id', adminUserId)

        // Re-seed demo data so the user can keep practicing
        await seedDemoData(tenantId, adminUserId);

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
    if (error) {
        console.error('Error adding supplier:', error)
        throw error
    }
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

// ============ CLIENTS ============
export async function addClientToDb(tenantId, clientData) {
    // Sanitize data: Remove fields that might be missing in older DB schemas
    const { default_discount, credit_limit, ...rest } = clientData;
    
    // For now, we try to insert with everything, but if it fails, we provide a fallback or specific error
    const { data, error } = await supabase
        .from('clients')
        .insert([{ ...clientData, tenant_id: tenantId }])
        .select()
    
    if (error) {
        if (error.message?.includes('default_discount') || error.message?.includes('column')) {
            console.warn('Falling back: Inserting client without default_discount/credit_limit due to missing columns');
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('clients')
                .insert([{ ...rest, tenant_id: tenantId }])
                .select()
            if (fallbackError) throw fallbackError;
            return fallbackData[0];
        }
        console.error('Error adding client:', error)
        throw error
    }
    return data[0]
}

export async function updateClientInDb(clientId, clientData) {
    const { default_discount, credit_limit, ...rest } = clientData;
    
    const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', clientId)
        .select()
    
    if (error) {
        if (error.message?.includes('default_discount') || error.message?.includes('column')) {
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('clients')
                .update(rest)
                .eq('id', clientId)
                .select()
            if (fallbackError) throw fallbackError;
            return fallbackData[0];
        }
        throw error
    }
    return data[0]
}

export async function deleteClientFromDb(clientId) {
    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
    if (error) throw error
    return true
}

// ============ PURCHASE ORDERS ============
export async function addPurchaseOrderToDb(tenantId, poData) {
    const { data, error } = await supabase
        .from('purchase_orders')
        .insert([{ ...poData, tenant_id: tenantId }])
        .select()
    if (error) {
        console.error('Error adding PO:', error)
        throw error
    }
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

    // 3. Update Book's Escandallo Costs with the REAL production cost
    const unitCost = po.total_cost / quantity
    const { data: book, error: bookFetchErr } = await supabase
        .from('books')
        .select('escandallo_costs')
        .eq('id', bookId)
        .single()
    
    if (!bookFetchErr && book) {
        const currentCosts = book.escandallo_costs || {}
        const updatedCosts = {
            ...currentCosts,
            impresion: Math.round(unitCost) // Actualizamos el costo de impresión real
        }
        
        await supabase
            .from('books')
            .update({ 
                escandallo_costs: updatedCosts,
                tiraje: quantity // Actualizamos el tiraje real también
            })
            .eq('id', bookId)
    }

    return true
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

// ============ GLOBAL CONFIGURATION ============
export async function getGlobalEmail() {
    try {
        // Primera opción: Intentar obtener desde el perfil del SuperAdmin (JSONB)
        const { data: userData, error: userErr } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'eusemac@me.com')
            .single()

        if (userData && userData.social_links && userData.social_links.globalContactEmail) {
            return userData.social_links.globalContactEmail
        }

        // Segunda opción: fallback a tabla de settings (por si la crearon en BD)
        const { data, error } = await supabase
            .from('admin_settings')
            .select('contact_email')
            .eq('id', 'global')
            .single()

        if (data && data.contact_email) return data.contact_email
    } catch {
        // ignorar errores
    }

    return 'eusemac@me.com'
}

export async function setGlobalEmail(email) {
    try {
        // Guardarlo en el perfil del SuperAdmin bajo social_links (JSONB)
        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'eusemac@me.com')
            .single()

        if (userData) {
            const currentLinks = userData.social_links || {}
            currentLinks.globalContactEmail = email
            await supabase.from('users').update({ social_links: currentLinks }).eq('email', 'eusemac@me.com')
        }

        // También intentar en admin_settings por si existe
        await supabase
            .from('admin_settings')
            .upsert({ id: 'global', contact_email: email })

        return true
    } catch {
        // No fallar si admin_settings no existe
        return true
    }
}
// ============ SUPERADMIN ACTIONS ============
export async function superAdminCreateTenant(name, plan = 'TRIAL') {
    const tenantId = iUUID()
    const { data, error } = await supabase
        .from('tenants')
        .insert({
            id: tenantId,
            name,
            plan,
            created_at: new Date().toISOString()
        })
        .select()

    if (error) {
        console.error('Error creating tenant:', error)
        return null
    }
    return data[0]
}
// ============ ONBOARDING REQUESTS ============
export async function submitOnboardingRequest(requestData) {
    const { data, error } = await supabase
        .from('onboarding_requests')
        .insert([requestData])
        .select()
    if (error) throw error
    return data[0]
}

export async function loadOnboardingRequests() {
    const { data, error } = await supabase
        .from('onboarding_requests')
        .select('*')
        .order('created_at', { ascending: false })
    if (error) {
        console.error('Error loading onboarding requests:', error)
        return []
    }
    return data
}

export async function updateOnboardingStatus(requestId, status, notes = '') {
    const { data, error } = await supabase
        .from('onboarding_requests')
        .update({ status, notes })
        .eq('id', requestId)
        .select()
    if (error) throw error
    return data[0]
}

export async function deleteAllOnboardingRequests() {
    const { error } = await supabase
        .from('onboarding_requests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) {
        console.error('Error deleting all requests:', error)
        return false
    }
    return true
}

export async function superAdminApproveOnboarding(request) {
    try {
        // 1. Create Tenant
        const tenantId = iUUID()
        const { error: tErr } = await supabase.from('tenants').insert({
            id: tenantId,
            name: request.editorial_name,
            plan: 'TRIAL'
        })
        if (tErr) throw tErr

        // 2. Create Admin User
        const userId = iUUID()
        const { error: uErr } = await supabase.from('users').insert({
            id: userId,
            tenant_id: tenantId,
            email: request.admin_email,
            password: 'bienvenido123', // Temporal password
            name: request.admin_name,
            role: 'ADMIN',
            avatar: request.admin_name.split(' ').map(w => w[0]).join('').toUpperCase(),
            first_login: true
        })
        if (uErr) throw uErr

        // 3. Seed Demo Data so users can practice!
        await seedDemoData(tenantId, userId);

        // 4. Set Initial Version
        await supabase.from('tenants').update({ version_installed: 'v3.1.5.7' }).eq('id', tenantId);

        // 5. Update Request
        return { success: true, tenantId, userId, editorial_name: request.editorial_name }
    } catch (err) {
        console.error('Approval error:', err)
        return { success: false, error: err.message }
    }
}

// ============ GLOBAL APP VERSIONS (MASTER HUB) ============
export async function getLatestAppVersion() {
    try {
        const { data, error } = await supabase
            .from('app_versions')
            .select('*')
            .order('release_date', { ascending: false })
            .limit(1)
            .single()
        
        if (error) {
            if (error.code === 'PGRST116') return { version: 'v3.1.5.0' } // Default if empty
            throw error
        }
        return data
    } catch (err) {
        console.warn('App version check warning (table might not exist yet):', err.message)
        return { version: 'v3.1.5.7' }
    }
}

export async function publishAppVersion(version, notes = []) {
    const { data, error } = await supabase
        .from('app_versions')
        .insert({
            version,
            notes,
            release_date: new Date().toISOString()
        })
        .select()
    if (error) throw error
    return data[0]
}

export async function updateTenantVersion(tenantId, version) {
    const { error } = await supabase
        .from('tenants')
        .update({ version_installed: version })
        .eq('id', tenantId)
    if (error) throw error
    return true
}

export async function clearDemoData(tenantId) {
    if (!tenantId) return false
    try {
        console.log(`[Cleaning] 🧹 Eliminando todo el rastro demo para tenant ${tenantId}...`)

        const filter = { tenant_id: tenantId }

        // Borrar por ID prefijado 'demo_'
        const mainTables = [
            'expenses', 'sales', 'inventory_physical', 'books', 'suppliers', 
            'users', 'audit_log', 'comments', 'alerts', 'quotes', 
            'purchase_orders', 'consignments', 'royalties', 'invoices', 'documents'
        ]

        for (const table of mainTables) {
            const { error } = await supabase
                .from(table)
                .delete()
                .match(filter)
                .ilike('id', 'demo_%')

            if (error) {
                // Si falla por ID (quizás no existe o es UUID), intentamos por book_id si aplica
                if (['inventory_physical', 'sales', 'royalties', 'consignments', 'comments', 'quotes', 'purchase_orders'].includes(table)) {
                    await supabase.from(table).delete().match(filter).ilike('book_id', 'demo_%')
                }
            }
        }

        return true
    } catch (err) {
        console.error('Clear Demo Failure:', err)
        return false
    }
}

// ============ EVENTS / FERIAS ============
export async function addEventToDb(tenantId, eventData, items) {
    const { data: event, error: eventErr } = await supabase
        .from('events')
        .insert([{
            name: eventData.name,
            start_date: (eventData.startDate && eventData.startDate.trim() !== "") ? eventData.startDate : null,
            end_date: (eventData.endDate && eventData.endDate.trim() !== "") ? eventData.endDate : null,
            location: eventData.location,
            notes: eventData.notes,
            status: 'open',
            tenant_id: tenantId
        }])
        .select()
    
    if (eventErr) throw eventErr

    if (items && items.length > 0) {
        // 1. Insert event items
        const { error: itemsErr } = await supabase
            .from('event_items')
            .insert(items.map(item => ({
                event_id: event[0].id,
                book_id: item.bookId,
                initial_qty: item.initialQty,
                tenant_id: tenantId
            })))
        if (itemsErr) throw itemsErr

        // 2. Automatically deduct from inventory (Stock Movement)
        for (const item of items) {
            const { data: inv } = await supabase
                .from('inventory_physical')
                .select('*')
                .eq('book_id', item.bookId)
                .single()
            
            if (inv) {
                const newExit = {
                    date: new Date().toISOString(),
                    quantity: item.initialQty,
                    reason: `Despacho a Feria: ${eventData.name}`,
                    type: 'feria'
                }
                const updatedExits = [...(inv.exits || []), newExit]
                const newStock = (inv.stock || 0) - item.initialQty
                
                await supabase
                    .from('inventory_physical')
                    .update({ 
                        stock: newStock, 
                        exits: updatedExits 
                    })
                    .eq('id', inv.id)
            }
        }
    }

    return event[0]
}

export async function updateEventInDb(eventId, updates) {
    const { data, error } = await supabase
        .from('events')
        .update({
            name: updates.name,
            start_date: (updates.startDate && updates.startDate.trim() !== "") ? updates.startDate : null,
            end_date: (updates.endDate && updates.endDate.trim() !== "") ? updates.endDate : null,
            location: updates.location,
            notes: updates.notes,
            status: updates.status
        })
        .eq('id', eventId)
        .select()
    if (error) throw error
    return data[0]
}

export async function settleEventInDb(eventId, itemsData) {
    // 1. Get event details for metadata
    const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

    // 2. Update event_items with final counts
    for (const item of itemsData) {
        const { error: itemErr } = await supabase
            .from('event_items')
            .update({
                sold_qty: item.soldQty,
                returned_qty: item.returnedQty,
                lost_qty: item.lostQty
            })
            .eq('id', item.id)
        if (itemErr) throw itemErr

        // 3. Officializing Stock Return (increment central inventory)
        if (item.returnedQty > 0) {
            const { data: inv } = await supabase
                .from('inventory_physical')
                .select('*')
                .eq('book_id', item.bookId)
                .single()
            
            if (inv) {
                const newEntry = {
                    date: new Date().toISOString(),
                    quantity: item.returnedQty,
                    reason: `Retorno de Feria: ${event.name}`,
                    type: 'retorno'
                }
                const updatedEntries = [...(inv.entries || []), newEntry]
                const newStock = (inv.stock || 0) + item.returnedQty
                
                await supabase
                    .from('inventory_physical')
                    .update({ 
                        stock: newStock, 
                        entries: updatedEntries 
                    })
                    .eq('id', inv.id)
            }
        }

        // 4. Officializing Sales (register as sales)
        if (item.soldQty > 0) {
            await supabase.from('sales').insert({
                tenant_id: event.tenant_id,
                book_id: item.bookId,
                book_title: item.bookTitle || 'Venta Feria',
                channel: 'Feria / Evento',
                type: 'fisico',
                quantity: item.soldQty,
                sale_date: new Date().toISOString(),
                status: 'finalizada',
                notes: `Venta originada en evento: ${event.name}`
            })
        }
    }

    // 5. Mark event as closed
    const { error: eventErr } = await supabase
        .from('events')
        .update({ status: 'closed' })
        .eq('id', eventId)
    
    if (eventErr) throw eventErr
    return true
}

export async function reopenEventInDb(eventId) {
    // 1. Get event and items with titles
    const { data: event, error: fetchErr } = await supabase
        .from('events')
        .select(`
            id, name, tenant_id,
            items:event_items(*)
        `)
        .eq('id', eventId)
        .single()
    
    if (fetchErr) throw fetchErr

    // 2. Revert inventory for "returned" items
    const items = event.items || []
    for (const item of items) {
        if (item.returned_qty > 0) {
            const { data: inv } = await supabase
                .from('inventory_physical')
                .select('*')
                .eq('book_id', item.book_id)
                .single()
            
            if (inv) {
                // Subtract returned_qty from stock (undoing the settle)
                const newStock = Math.max(0, (inv.stock || 0) - item.returned_qty)
                // Remove the "retorno" entry from history
                const updatedEntries = (inv.entries || []).filter(e => e.reason !== `Retorno de Feria: ${event.name}`)
                
                await supabase
                    .from('inventory_physical')
                    .update({ 
                        stock: newStock, 
                        entries: updatedEntries 
                    })
                    .eq('id', inv.id)
            }
        }
    }

    // 3. Delete Sales associated with this event
    // Since we don't have a direct link to sales, we use the notes pattern used in settleEventInDb
    const searchNote = `Venta originada en evento: ${event.name}`
    const { error: saleErr } = await supabase
        .from('sales')
        .delete()
        .eq('channel', 'Feria / Evento')
        .eq('notes', searchNote)
    
    if (saleErr) {
        console.warn('Could not delete sales during reopen', saleErr)
    }

    // 4. Update Event status and reset item counts
    await supabase
        .from('event_items')
        .update({ 
            sold_qty: 0, 
            returned_qty: 0, 
            lost_qty: 0 
        })
        .eq('event_id', eventId)

    const { error: eventErr } = await supabase
        .from('events')
        .update({ status: 'open' })
        .eq('id', eventId)
    
    if (eventErr) throw eventErr
    return true
}

export async function deleteEventFromDb(eventId) {
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
    if (error) throw error
    return true
}


