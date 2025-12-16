-- Script para limpiar la tabla medication_usage_history
-- Ejecuta esto en tu cliente PostgreSQL (pgAdmin, DBeaver, psql, etc.)

-- 1. Eliminar todos los registros viejos
TRUNCATE TABLE medication_usage_history CASCADE;

-- 2. Eliminar las foreign keys viejas
ALTER TABLE medication_usage_history DROP CONSTRAINT IF EXISTS "FK_medication_usage_history_veterinarian";
ALTER TABLE medication_usage_history DROP CONSTRAINT IF EXISTS "FK_medication_usage_history_appointment";
ALTER TABLE medication_usage_history DROP CONSTRAINT IF EXISTS "FK_medication_usage_history_pet";
ALTER TABLE medication_usage_history DROP CONSTRAINT IF EXISTS "FK_medication_usage_history_medication";

-- 3. Eliminar la tabla completa
DROP TABLE IF EXISTS medication_usage_history CASCADE;

-- 4. Ahora puedes reiniciar el servidor NestJS
-- TypeORM recreará la tabla con la estructura correcta
