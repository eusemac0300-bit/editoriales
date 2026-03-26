import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://iwbljdkmabwwcuzmmzhg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94'
)

const tenantId = '8c87c45f-4bcf-4ba0-a078-436ed5bc116f'
const now = new Date().toISOString()
const monthAgo = new Date(Date.now() - 2592000000).toISOString()
const twoMonthsAgo = new Date(Date.now() - 5184000000).toISOString()

async function safeInsert(table, data, label) {
    if (!data || data.length === 0) return [];
    console.log(`[Seeding] ⏳ Insertando ${label} (${data.length} registros) en ${table}...`)
    const { data: result, error } = await supabase.from(table).upsert(data, { onConflict: 'id' }).select()
    if (error) {
        console.error(`[Seeding] ❌ Error en ${label} (${table}):`, error.message)
        throw new Error(`Error en ${label}: ${error.message}`)
    }
    console.log(`[Seeding] ✅ ${label}: ${(result || []).length} registros insertados`)
    return result
}

async function injectNewDemo() {
    console.log(`[Seeding] 🚀 Inyectando DEMO MODE 2.0 para tenant MÁSTER: ${tenantId}`)

    const suffix = tenantId.replace(/-/g, '').slice(-12)
    const mkId = (prefixStr) => `ffffffff-${prefixStr}-4000-8000-${suffix}`

    // 1. AUTHORS
    const demoAuthors = [
        { id: mkId('a001'), tenant_id: tenantId, email: `autor1_${suffix}@demo.cl`, password: 'demo', name: 'Isabel Allende (Demo)', role: 'AUTOR', avatar: 'IA', bio: 'Escritora chilena, premio nacional de literatura.', first_login: true },
        { id: mkId('a002'), tenant_id: tenantId, email: `autor2_${suffix}@demo.cl`, password: 'demo', name: 'Jorge Luis Borges (Demo)', role: 'AUTOR', avatar: 'JB', bio: 'Escritor argentino erudito.', first_login: true },
        { id: mkId('a003'), tenant_id: tenantId, email: `autor3_${suffix}@demo.cl`, password: 'demo', name: 'Gabriela Mistral (Demo)', role: 'AUTOR', avatar: 'GM', bio: 'Poetisa, diplomática y pedagoga chilena.', first_login: true }
    ]
    await safeInsert('users', demoAuthors, 'Autores')

    // 2. SUPPLIERS & CLIENTS
    const demoSuppliers = [
        { id: mkId('s001'), tenant_id: tenantId, name: 'Imprenta Andina S.A.', type: 'IMPRENTA', email: 'ventas@andina.cl', phone: '+56911112222' },
        { id: mkId('s002'), tenant_id: tenantId, name: 'Editorial Planeta (Servicios)', type: 'SERVICIOS', email: 'servicios@planeta.cl', phone: '+56933334444' }
    ]
    await safeInsert('suppliers', demoSuppliers, 'Proveedores')

    const demoClients = [
        { id: mkId('c001'), tenant_id: tenantId, name: 'Librería Antártica', type: 'LIBRERIA', email: 'compras@antartica.cl', phone: '+56222223333', discount_percent: 40 },
        { id: mkId('c002'), tenant_id: tenantId, name: 'Librería Feria Chilena', type: 'LIBRERIA', email: 'compras@feriachilena.cl', phone: '+56244445555', discount_percent: 40 },
        { id: mkId('c003'), tenant_id: tenantId, name: 'Distribuidora ZigZag', type: 'DISTRIBUIDORA', email: 'operaciones@zigzag.cl', phone: '+56266667777', discount_percent: 60 }
    ]
    await safeInsert('clients', demoClients, 'Clientes')

    // 3. BOOKS
    const titles = [
        "El Laberinto de Papel", "Crónicas del Mañana", "Sinfonía en el Desierto",
        "El Último Manuscrito", "Brisas del Sur", "Fragmentos de Silencio",
        "La Ciudad de Cristal", "Relatos Perdidos", "Ecos de Montaña", "Poesía Reunida"
    ]

    const demoBooks = titles.map((title, i) => {
        const author = demoAuthors[i % 3]
        const isFiccion = i % 2 === 0
        return {
            id: mkId(`b00${i}`),
            tenant_id: tenantId,
            title: title,
            author_id: author.id,
            author_name: author.name,
            status: i < 7 ? 'Publicado' : (i < 9 ? 'Edición' : 'Original'),
            pvp: 12000 + (i * 2000),
            isbn: `978-956-00-${100 + i}`,
            sku: `DEMO-BK-${i}`,
            genre: isFiccion ? 'Novela' : 'Ensayo',
            pages: 150 + (i * 20),
            royalty_percent: 10,
            advance: i === 0 ? 500000 : (i === 1 ? 200000 : 0),
            created_at: i < 5 ? twoMonthsAgo : monthAgo,
            format: 'Físico'
        }
    })
    await safeInsert('books', demoBooks, 'Libros')

    // 4. INVENTORY
    const demoInventory = demoBooks.map((b, i) => ({
        id: mkId(`i00${i}`),
        tenant_id: tenantId,
        book_id: b.id,
        stock: b.status === 'Publicado' ? Math.floor(100 + (Math.random() * 400)) : 0,
        min_stock: 50,
        location: 'Bodega Central - Rack A'
    }))
    await safeInsert('inventory_physical', demoInventory, 'Inventario')

    // 5. SALES
    const demoSales = []
    const pubBooks = demoBooks.filter(b => b.status === 'Publicado')
    
    let saleCounter = 0;
    pubBooks.slice(0, 3).forEach((b) => {
        const client = demoClients[saleCounter % 3]
        const qty = 50 + (saleCounter * 10)
        const unitPrice = b.pvp * (1 - (client.discount_percent / 100))
        const total = qty * unitPrice
        
        demoSales.push({
            id: mkId(`v00${saleCounter}`),
            tenant_id: tenantId,
            client_id: client.id,
            client_name: client.name,
            book_id: b.id,
            book_title: b.title,
            channel: 'Mayorista',
            quantity: qty,
            unit_price: unitPrice,
            discount_percent: client.discount_percent,
            total_amount: total,
            neto: total,
            tax: total * 0.19,
            status: saleCounter === 0 ? 'Pendiente' : 'Completada',
            sale_date: saleCounter === 0 ? now : monthAgo
        })
        saleCounter++
    })

    pubBooks.slice(0, 5).forEach((b) => {
        const qty = 1 + (saleCounter % 3)
        const total = qty * b.pvp
        
        demoSales.push({
            id: mkId(`v00${saleCounter}`),
            tenant_id: tenantId,
            client_name: 'Venta Web Automática',
            book_id: b.id,
            book_title: b.title,
            channel: 'Web',
            quantity: qty,
            unit_price: b.pvp,
            discount_percent: 0,
            total_amount: total,
            neto: total,
            tax: total * 0.19,
            status: 'Completada',
            sale_date: new Date(Date.now() - (saleCounter * 86400000)).toISOString()
        })
        saleCounter++
    })
    await safeInsert('sales', demoSales, 'Ventas')

    // 6. CONSIGNMENTS
    const demoConsignments = []
    let consCounter = 0;
    pubBooks.slice(0, 4).forEach((b) => {
        const client = demoClients[consCounter % 2]
        demoConsignments.push({
            id: mkId(`g00${consCounter}`),
            tenant_id: tenantId,
            client_id: client.id,
            client_name: client.name,
            book_id: b.id,
            sent_quantity: 30 + (consCounter * 10),
            sold_quantity: 5 + consCounter,
            returned_quantity: consCounter === 1 ? 2 : 0,
            status: 'activa',
            sent_date: twoMonthsAgo,
            notes: 'Consignación inicial de prueba'
        })
        consCounter++
    })
    await safeInsert('consignments', demoConsignments, 'Consignaciones')

    // 7. EXPENSES & ROYALTIES
    const demoExpenses = [
        { id: mkId('e001'), tenant_id: tenantId, category: 'IMPRENTA', description: `Impresión 1ra Edición - ${demoBooks[0].title}`, amount: 850000, date: twoMonthsAgo, status: 'PAGADO', supplier_id: demoSuppliers[0].id },
        { id: mkId('e002'), tenant_id: tenantId, category: 'MARKETING', description: 'Campaña Meta Ads Lanzamientos', amount: 150000, date: monthAgo, status: 'PAGADO' },
        { id: mkId('e003'), tenant_id: tenantId, category: 'SOFTWARE', description: 'Suscripción AutoBook Pro', amount: 35000, date: now, status: 'PENDIENTE' }
    ]
    await safeInsert('expenses', demoExpenses, 'Gastos')

    const demoRoyalties = [
        { id: mkId('r001'), tenant_id: tenantId, book_id: demoBooks[0].id, author_id: demoAuthors[0].id, period: '2026-Q1', total_sales: 1500000, royalty_amount: 150000, status: 'Pagado' },
        { id: mkId('r002'), tenant_id: tenantId, book_id: demoBooks[1].id, author_id: demoAuthors[1].id, period: '2026-Q1', total_sales: 450000, royalty_amount: 45000, status: 'Pendiente' }
    ]
    await safeInsert('royalties', demoRoyalties, 'Regalías')

    console.log(`[Seeding] ✅ INYECCIÓN COMPLETADA CON ÉXITO.`)
}

injectNewDemo().catch(console.error)
