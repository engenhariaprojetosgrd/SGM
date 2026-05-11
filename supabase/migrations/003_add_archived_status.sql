-- ============================================================
-- SGM – Migration 003
-- Adiciona status 'archived' à tabela hoses
-- ============================================================
-- Esta migration é idempotente: pode ser executada várias vezes sem efeito colateral.
--
-- Contexto: o schema 001 originalmente só permitia status IN ('active','replaced').
-- O front-end passou a usar o status 'archived' (botão "Arquivar mangueira"),
-- então é necessário expandir o CHECK constraint.

ALTER TABLE hoses DROP CONSTRAINT IF EXISTS hoses_status_check;

ALTER TABLE hoses ADD CONSTRAINT hoses_status_check
  CHECK (status IN ('active', 'replaced', 'archived'));
