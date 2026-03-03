import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://iwbljdkmabwwcuzmmzhg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94';
const supabase = createClient(supabaseUrl, supabaseKey);

const tenantId = 't_master';

async function restore() {
    console.log('Reading initialData.json...');
    const dataPath = path.resolve('./src/data/initialData.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const db = JSON.parse(rawData);

    // Filter out users that are already in the DB (like u_master)
    const { data: existingUsers } = await supabase.from('users').select('id').eq('tenant_id', tenantId);
    const existingIds = existingUsers.map(u => u.id);

    console.log('Restoring Users...');
    for (const u of db.users) {
        if (!existingIds.includes(u.id)) {
            await supabase.from('users').insert({
                id: u.id,
                tenant_id: tenantId,
                email: u.email,
                password: u.password,
                name: u.name,
                role: u.role,
                avatar: u.avatar,
                title: u.title,
                bio: u.bio,
                social_links: u.socialLinks,
                first_login: u.firstLogin !== undefined ? u.firstLogin : false
            });
        }
    }

    console.log('Restoring Books...');
    for (const b of db.books) {
        await supabase.from('books').upsert({
            id: b.id,
            tenant_id: tenantId,
            title: b.title,
            author_id: b.authorId,
            author_name: b.authorName,
            isbn: b.isbn,
            genre: b.genre,
            status: b.status,
            assigned_to: b.assignedTo,
            royalty_percent: b.royaltyPercent,
            advance: b.advance,
            pvp: b.pvp,
            contract_expiry: b.contractExpiry,
            created_at: b.createdAt,
            cover: b.cover,
            synopsis: b.synopsis
        });
    }

    console.log('Restoring Inventory (Physical)...');
    for (const p of db.inventory.physical) {
        await supabase.from('inventory_physical').upsert({
            tenant_id: tenantId,
            book_id: p.bookId,
            stock: p.stock,
            min_stock: p.minStock,
            entries: p.entries,
            exits: p.exits
        });
    }

    console.log('Restoring Invoices...');
    for (const i of db.finances.invoices) {
        await supabase.from('invoices').upsert({
            id: i.id,
            tenant_id: tenantId,
            book_id: i.bookId,
            type: i.type,
            concept: i.concept,
            amount: i.amount,
            provider: i.provider,
            date: i.date,
            status: i.status
        });
    }

    console.log('Restoring Royalties...');
    for (const r of db.finances.royalties) {
        await supabase.from('royalties').upsert({
            id: r.id,
            tenant_id: tenantId,
            author_id: r.authorId,
            book_id: r.bookId,
            period: r.period,
            total_sales: r.totalSales,
            sales_amount: r.salesAmount,
            royalty_percent: r.royaltyPercent,
            gross_royalty: r.grossRoyalty,
            advance: r.advance,
            net_royalty: r.netRoyalty,
            status: r.status
        });
    }

    console.log('Restoring Comments...');
    for (const c of db.comments) {
        await supabase.from('comments').upsert({
            id: c.id,
            tenant_id: tenantId,
            book_id: c.bookId,
            user_id: c.userId,
            user_name: c.userName,
            role: c.role,
            text: c.text,
            date: c.date,
            category: c.category
        });
    }

    console.log('Restoring Audit Log...');
    for (const a of db.auditLog) {
        await supabase.from('audit_log').upsert({
            id: a.id,
            tenant_id: tenantId,
            date: a.date,
            user_id: a.userId,
            user_name: a.userName,
            action: a.action,
            type: a.type
        });
    }

    console.log('✅ Restauración de BD Finalizada!');
}
restore();
