-- ===============================================================
-- POBLADO DE 10 LIBROS Y ECOSISTEMA EDITORIAL COMPLETO (TRIAL / DEMO)
-- Fecha: 2026-10-14
-- Versión app: v3.2.3.21
-- ===============================================================

-- 1. ASEGURAR QUE EL TENANT DE DEMO EXISTE
INSERT INTO tenants (id, name, plan, logo_url)
VALUES ('demo-tenant-id', 'Editorial Demo (Trial)', 'PRO', NULL)
ON CONFLICT (id) DO UPDATE 
SET name = 'Editorial Demo (Trial)', plan = 'PRO';

-- 2. USUARIOS (Trial Admin, Autores y Colaboradores)
INSERT INTO users (id, tenant_id, email, password, name, role, avatar, title, bio, first_login) VALUES
('trial-u1', 'demo-tenant-id', 'trial@editorial.cl', 'demo', 'Usuario Trial (Demo)', 'ADMIN', 'UT', 'Editor Director', 'Sesión activa de evaluación con permisos completos.', false),
('trial-u2', 'demo-tenant-id', 'diego.corrector@demo.cl', 'demo', 'Diego Valenzuela', 'FREELANCE', 'DV', 'Corrector de Estilo Senior', 'Especialista en narrativa latinoamericana y ensayo académico.', false),
('trial-u3', 'demo-tenant-id', 'martina.diseno@demo.cl', 'demo', 'Martina Rojas', 'FREELANCE', 'MR', 'Diseñadora Editorial & Portadista', 'Diseñadora con más de 10 años en maquetación de catálogos.', false),
('trial-a1', 'demo-tenant-id', 'isabel.allende@demo.cl', 'demo', 'Isabel Allende Torres', 'AUTOR', 'IA', 'Autora Destacada', 'Escritora chilena, referente de la narrativa histórica.', false),
('trial-a2', 'demo-tenant-id', 'jorge.borges@demo.cl', 'demo', 'Jorge Luis Borges', 'AUTOR', 'JB', 'Autor & Ensayista', 'Erudito de la literatura fantástica, laberintos y espejos.', false),
('trial-a3', 'demo-tenant-id', 'gabriela.mistral@demo.cl', 'demo', 'Gabriela Mistral', 'AUTOR', 'GM', 'Premio Nobel & Pedagoga', 'Poeta chilena, cumbre del modernismo latinoamericano.', false),
('trial-a4', 'demo-tenant-id', 'roberto.fuentes@demo.cl', 'demo', 'Roberto Fuentes', 'AUTOR', 'RF', 'Cuentista y Cronista', 'Narrador urbano galardonado por sus crónicas costeras.', false)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, password = EXCLUDED.password;

-- 3. PROVEEDORES
INSERT INTO suppliers (id, tenant_id, name, type, contact_name, email, phone, tax_id, address, comuna, ciudad) VALUES
('trial-s1', 'demo-tenant-id', 'Imprenta Andina S.A.', 'IMPRENTA', 'Carlos Mendoza', 'contacto@imprentaandina.cl', '+56 2 2789 4400', '76.842.110-3', 'Av. Industrial 450', 'San Joaquín', 'Santiago'),
('trial-s2', 'demo-tenant-id', 'Servicios Gráficos Planeta SpA', 'SERVICIOS', 'Verónica Silva', 'operaciones@graficosplaneta.cl', '+56 9 8451 2299', '77.102.390-K', 'Calle Los Talleres 890', 'Providencia', 'Santiago'),
('trial-s3', 'demo-tenant-id', 'Distribuidora Papelera del Pacífico', 'PAPELERA', 'Rodrigo Araya', 'ventas@papeldelpacifico.cl', '+56 2 2330 9911', '76.220.440-1', 'Camino a Melipilla 1200', 'Maipú', 'Santiago')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 4. CLIENTES
INSERT INTO clients (id, tenant_id, name, type, contact_name, email, phone, discount_percent, tax_id, city) VALUES
('trial-c1', 'demo-tenant-id', 'Librería Antártica', 'LIBRERIA', 'Francisca Valdés', 'compras@antartica.cl', '+56 2 2490 8000', 40, '96.550.210-4', 'Santiago'),
('trial-c2', 'demo-tenant-id', 'Feria Chilena del Libro', 'LIBRERIA', 'Gonzalo Peñaloza', 'pedidos@feriachilena.cl', '+56 2 2638 2210', 40, '81.990.120-8', 'Santiago'),
('trial-c3', 'demo-tenant-id', 'Distribuidora ZigZag S.A.', 'DISTRIBUIDORA', 'Lorena Bravo', 'distribucion@zigzag.cl', '+56 2 2810 7400', 55, '91.430.000-2', 'Santiago'),
('trial-c4', 'demo-tenant-id', 'Librería Qué Leo (Providencia)', 'LIBRERIA', 'Matías Osorio', 'providencia@queleochile.cl', '+56 9 9123 4567', 35, '76.321.980-5', 'Santiago')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 5. 10 LIBROS
INSERT INTO books (
    id, tenant_id, title, author_id, author_name, isbn, genre, status, assigned_to, 
    royalty_percent, advance, pvp, created_at, synopsis, width, height, pages, 
    pages_color, sku, has_legal_deposit, legal_deposit_number, cover_type, flaps, 
    flap_width, interior_paper, cover_paper, cover_finish, tiraje, contract_status, contract_date
) VALUES
('trial-b1', 'demo-tenant-id', 'El Laberinto de Papel', 'trial-a1', 'Isabel Allende Torres', '978-956-345-101-1', 'Novela Histórica', 'Publicado', '["trial-u2"]', 10, 800000, 18990, NOW() - INTERVAL '120 days', 'Saga familiar ambientada en el Cono Sur entre bibliotecas clandestinas.', '15', '23', 340, 'B/N', 'BK-LAB-01', 'Sí', '2025-1102', 'Tapa Blanda', 'Sí', '8', 'Bond Ahuesado 80g', 'Couché 300g', 'Mate con Barniz Sectorizado', 1000, 'Firmado', '2025-10-15'),
('trial-b2', 'demo-tenant-id', 'Crónicas del Mañana', 'trial-a2', 'Jorge Luis Borges', '978-956-345-102-8', 'Ensayo Filosófico', 'Publicado', '["trial-u2", "trial-u3"]', 12, 500000, 15990, NOW() - INTERVAL '105 days', 'Reflexiones laberínticas sobre el tiempo circular y la memoria infinita.', '14', '21', 220, 'B/N', 'BK-CRO-02', 'Sí', '2025-1490', 'Tapa Blanda', 'Sí', '7', 'Ahuesado 75g', 'Cartulina Reversa Café 280g', 'Soft Touch', 800, 'Firmado', '2025-11-01'),
('trial-b3', 'demo-tenant-id', 'Sinfonía en el Desierto', 'trial-a3', 'Gabriela Mistral', '978-956-345-103-5', 'Poesía Lírica', 'Publicado', '["trial-u3"]', 10, 350000, 12990, NOW() - INTERVAL '90 days', 'Poemario lírico inspirado en la aridez luminosa de Atacama.', '13', '19', 160, 'B/N', 'BK-SIN-03', 'Sí', '2025-1822', 'Tapa Dura', 'No', '0', 'Papel Libro 80g', 'Tapa Dura al Cromo', 'Polimate', 600, 'Firmado', '2025-11-20'),
('trial-b4', 'demo-tenant-id', 'El Último Manuscrito', 'trial-a1', 'Isabel Allende Torres', '978-956-345-104-2', 'Thriller / Ficción', 'Publicado', '["trial-u2"]', 12, 1000000, 19990, NOW() - INTERVAL '75 days', 'Un manuscrito perdido en Valparaíso desata una trama de secretos familiares.', '15', '23', 410, 'B/N', 'BK-MAN-04', 'Sí', '2026-0045', 'Tapa Blanda', 'Sí', '8', 'Bond Ahuesado 80g', 'Couché 300g', 'Brillante', 1200, 'Firmado', '2025-12-10'),
('trial-b5', 'demo-tenant-id', 'Brisas del Sur', 'trial-a4', 'Roberto Fuentes', '978-956-345-105-9', 'Cuentos Regionales', 'Publicado', '["trial-u2"]', 10, 250000, 14990, NOW() - INTERVAL '60 days', 'Doce relatos costeros que viajan por caletas y la lluvia en Puerto Montt.', '14', '21', 190, 'B/N', 'BK-BRI-05', 'Sí', '2026-0210', 'Tapa Blanda', 'Sí', '7', 'Ahuesado 75g', 'Couché 300g', 'Mate', 700, 'Firmado', '2026-01-05'),
('trial-b6', 'demo-tenant-id', 'Fragmentos de Silencio', 'trial-a3', 'Gabriela Mistral', '978-956-345-106-6', 'Poesía Contemporánea', 'Publicado', '["trial-u3"]', 10, 300000, 13500, NOW() - INTERVAL '50 days', 'Poemas breves en torno a la soledad y la contemplación cordillerana.', '13', '20', 140, 'B/N', 'BK-FRA-06', 'Sí', '2026-0399', 'Tapa Blanda', 'Sí', '6', 'Bond Ahuesado 80g', 'Cartulina Kimberly 250g', 'Textura Natural', 500, 'Firmado', '2026-01-18'),
('trial-b7', 'demo-tenant-id', 'La Ciudad de Cristal', 'trial-a1', 'Isabel Allende Torres', '978-956-345-107-3', 'Fantasía / Distopía', 'Imprenta', '["trial-u2", "trial-u3"]', 12, 600000, 17990, NOW() - INTERVAL '40 days', 'Una metrópolis subterránea donde los recuerdos se venden como mercancía de lujo.', '15', '23', 280, 'B/N', 'BK-CRIS-07', 'En trámite', '', 'Tapa Blanda', 'Sí', '8', 'Bond Ahuesado 80g', 'Couché 300g', 'Mate con Barniz UV', 1000, 'Firmado', '2026-02-01'),
('trial-b8', 'demo-tenant-id', 'Relatos Perdidos', 'trial-a2', 'Jorge Luis Borges', '978-956-345-108-0', 'Antología Narrativa', 'Maquetación', '["trial-u3"]', 10, 400000, 16500, NOW() - INTERVAL '30 days', 'Cuentos inéditos rescatados de periódicos antiguos y cuadernos de viaje.', '14', '21', 250, 'B/N', 'BK-REL-08', 'En trámite', '', 'Tapa Blanda', 'Sí', '7', 'Ahuesado 75g', 'Couché 300g', 'Mate', 800, 'Firmado', '2026-02-15'),
('trial-b9', 'demo-tenant-id', 'Ecos de Montaña', 'trial-a4', 'Roberto Fuentes', '978-956-345-109-7', 'Ensayo Andino', 'Corrección', '["trial-u2"]', 10, 200000, 14000, NOW() - INTERVAL '20 days', 'Un recorrido etnográfico y lírico por los pasos cordilleranos y sus arrieros.', '14', '21', 180, 'B/N', 'BK-ECO-09', 'No', '', 'Tapa Blanda', 'Sí', '6', 'Bond Ahuesado 80g', 'Couché 300g', 'Mate', 600, 'En Revisión', '2026-03-01'),
('trial-b10', 'demo-tenant-id', 'Poesía Reunida (Edición Conmemorativa)', 'trial-a3', 'Gabriela Mistral', '978-956-345-110-3', 'Antología / Obra Completa', 'Edición', '["trial-u2", "trial-u3"]', 15, 1200000, 24990, NOW() - INTERVAL '10 days', 'Tomo de lujo con la obra completa comentada y facsímiles de manuscritos.', '16', '24', 520, 'Color', 'BK-POE-10', 'En trámite', '', 'Tapa Dura con Sobrecubierta', 'Sí', '10', 'Couché Opaco 100g', 'Tela Holandesa con Estampado en Oro', 'Foil Dorado & Cinta', 1500, 'Firmado', '2026-03-10')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, pvp = EXCLUDED.pvp;

-- 6. INVENTARIO FÍSICO
INSERT INTO inventory_physical (tenant_id, book_id, stock, min_stock) VALUES
('demo-tenant-id', 'trial-b1', 342, 100),
('demo-tenant-id', 'trial-b2', 185, 80),
('demo-tenant-id', 'trial-b3', 94, 50),
('demo-tenant-id', 'trial-b4', 520, 150),
('demo-tenant-id', 'trial-b5', 140, 60),
('demo-tenant-id', 'trial-b6', 210, 50),
('demo-tenant-id', 'trial-b7', 0, 100),
('demo-tenant-id', 'trial-b8', 0, 80),
('demo-tenant-id', 'trial-b9', 0, 60),
('demo-tenant-id', 'trial-b10', 0, 150)
ON CONFLICT (tenant_id, book_id) DO UPDATE SET stock = EXCLUDED.stock;

-- 7. VENTAS (Mayoristas B2B y Web B2C)
INSERT INTO sales (id, tenant_id, book_id, book_title, channel, type, quantity, unit_price, total_amount, neto, iva, sale_date, client_name, document_ref, status) VALUES
('trial-v1', 'demo-tenant-id', 'trial-b1', 'El Laberinto de Papel', 'Mayorista', 'B2B', 150, 11394, 1709100, 1436218, 272882, CURRENT_DATE - 45, 'Librería Antártica', 'FC-10492', 'Completada'),
('trial-v2', 'demo-tenant-id', 'trial-b4', 'El Último Manuscrito', 'Mayorista', 'B2B', 200, 11994, 2398800, 2015798, 383002, CURRENT_DATE - 35, 'Feria Chilena del Libro', 'FC-10512', 'Completada'),
('trial-v3', 'demo-tenant-id', 'trial-b2', 'Crónicas del Mañana', 'Mayorista', 'B2B', 120, 7196, 863520, 725647, 137873, CURRENT_DATE - 25, 'Distribuidora ZigZag S.A.', 'FC-10544', 'Completada'),
('trial-v4', 'demo-tenant-id', 'trial-b3', 'Sinfonía en el Desierto', 'Web', 'B2C', 12, 12990, 155880, 131000, 24880, CURRENT_DATE - 18, 'Ventas Web Shopify', 'BOL-9421', 'Completada'),
('trial-v5', 'demo-tenant-id', 'trial-b5', 'Brisas del Sur', 'Mayorista', 'B2B', 80, 9744, 779520, 655059, 124461, CURRENT_DATE - 12, 'Librería Qué Leo (Providencia)', 'FC-10580', 'Completada'),
('trial-v6', 'demo-tenant-id', 'trial-b6', 'Fragmentos de Silencio', 'Web', 'B2C', 8, 13500, 108000, 90756, 17244, CURRENT_DATE - 8, 'Ventas Web Tienda Directa', 'BOL-9502', 'Completada'),
('trial-v7', 'demo-tenant-id', 'trial-b1', 'El Laberinto de Papel', 'Mayorista', 'B2B', 100, 11394, 1139400, 957479, 181921, CURRENT_DATE - 3, 'Librería Antártica', 'FC-10615', 'Completada'),
('trial-v8', 'demo-tenant-id', 'trial-b4', 'El Último Manuscrito', 'Web', 'B2C', 15, 19990, 299850, 251975, 47875, CURRENT_DATE - 1, 'Ventas Web Tienda Directa', 'BOL-9588', 'Completada')
ON CONFLICT (id) DO UPDATE SET total_amount = EXCLUDED.total_amount;

-- 8. CONSIGNACIONES
INSERT INTO consignments (id, tenant_id, book_id, client_name, contact_info, sent_date, sent_quantity, sold_quantity, returned_quantity, status, notes) VALUES
('trial-g1', 'demo-tenant-id', 'trial-b1', 'Librería Antártica (Parque Arauco)', 'contacto@antartica.cl', CURRENT_DATE - 60, 80, 42, 0, 'activa', 'Excelente rotación en mesa de novedades'),
('trial-g2', 'demo-tenant-id', 'trial-b2', 'Feria Chilena del Libro (Huérfanos)', 'pedidos@feriachilena.cl', CURRENT_DATE - 50, 50, 28, 2, 'activa', 'Liquidación mensual acordada a 30 días'),
('trial-g3', 'demo-tenant-id', 'trial-b3', 'Librería Qué Leo (Providencia)', 'providencia@queleochile.cl', CURRENT_DATE - 35, 30, 14, 0, 'activa', 'Exhibición en escaparate principal'),
('trial-g4', 'demo-tenant-id', 'trial-b5', 'Librería Antártica (Costanera Center)', 'costanera@antartica.cl', CURRENT_DATE - 25, 40, 18, 0, 'activa', 'Revisión programada a fin de mes')
ON CONFLICT (id) DO UPDATE SET sold_quantity = EXCLUDED.sold_quantity;

-- 9. GASTOS
INSERT INTO expenses (id, tenant_id, category, description, amount, date, supplier_id, payment_method, status, notes) VALUES
('trial-e1', 'demo-tenant-id', 'IMPRENTA', 'Impresión 1.000 ejemplares - El Laberinto de Papel', 980000, CURRENT_DATE - 85, 'trial-s1', 'Transferencia Bancaria', 'PAGADO', 'Factura 4821 cancelada'),
('trial-e2', 'demo-tenant-id', 'DISEÑO', 'Maquetación y cubierta - Crónicas del Mañana', 220000, CURRENT_DATE - 70, 'trial-s2', 'Transferencia', 'PAGADO', 'Boleta de honorarios pagada'),
('trial-e3', 'demo-tenant-id', 'MARKETING', 'Campaña Meta Ads & Google Ads Lanzamientos', 180000, CURRENT_DATE - 40, NULL, 'Tarjeta de Crédito', 'PAGADO', 'Campaña segmentada por intereses'),
('trial-e4', 'demo-tenant-id', 'IMPRENTA', 'Impresión 1.200 ejemplares - El Último Manuscrito', 1150000, CURRENT_DATE - 30, 'trial-s1', 'Cheque a 30 días', 'PAGADO', 'Factura 5012 cancelada'),
('trial-e5', 'demo-tenant-id', 'SOFTWARE', 'Suscripción Plataforma Editorial Pro (Plan Pro)', 35000, CURRENT_DATE - 5, NULL, 'Pago Automático', 'PAGADO', 'Mensualidad suite editorial')
ON CONFLICT (id) DO UPDATE SET amount = EXCLUDED.amount;

-- 10. REGALÍAS
INSERT INTO royalties (id, tenant_id, author_id, author_name, book_id, period, period_start, period_end, total_sales_amount, total_units_sold, royalty_percent, gross_royalty, advance_deducted, net_royalty, status) VALUES
('trial-r1', 'demo-tenant-id', 'trial-a1', 'Isabel Allende Torres', 'trial-b1', '2026-Q1', '2026-01-01', '2026-03-31', 2848500, 250, 10, 284850, 284850, 0, 'aprobado'),
('trial-r2', 'demo-tenant-id', 'trial-a2', 'Jorge Luis Borges', 'trial-b2', '2026-Q1', '2026-01-01', '2026-03-31', 863520, 120, 12, 103622, 103622, 0, 'aprobado'),
('trial-r3', 'demo-tenant-id', 'trial-a4', 'Roberto Fuentes', 'trial-b5', '2026-Q1', '2026-01-01', '2026-03-31', 779520, 80, 10, 77952, 77952, 0, 'pendiente')
ON CONFLICT (id) DO UPDATE SET total_sales_amount = EXCLUDED.total_sales_amount;

-- ===============================================================
-- VERIFICACIÓN FINAL (Muestra los 10 libros del usuario Trial)
-- ===============================================================
SELECT id, title, author_name, status, pvp, tiraje FROM books WHERE tenant_id = 'demo-tenant-id';
