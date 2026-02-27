-- =============================================
-- HABILITAR SUPABASE REALTIME EN TABLAS
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Agregar tablas a la publicación realtime de supabase
ALTER PUBLICATION supabase_realtime ADD TABLE books;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_log;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_physical;
ALTER PUBLICATION supabase_realtime ADD TABLE royalties;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Habilitar replica identity FULL para enviar datos completos
ALTER TABLE books REPLICA IDENTITY FULL;
ALTER TABLE comments REPLICA IDENTITY FULL;
ALTER TABLE audit_log REPLICA IDENTITY FULL;
ALTER TABLE alerts REPLICA IDENTITY FULL;
ALTER TABLE inventory_physical REPLICA IDENTITY FULL;
ALTER TABLE royalties REPLICA IDENTITY FULL;
ALTER TABLE invoices REPLICA IDENTITY FULL;
ALTER TABLE users REPLICA IDENTITY FULL;
