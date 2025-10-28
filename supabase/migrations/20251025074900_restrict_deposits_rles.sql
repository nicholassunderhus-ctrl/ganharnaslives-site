-- Migration: 20251025074900_restrict_deposits_rles.sql
-- Objetivo: Garantir que apenas o backend (usando a service_role_key) possa modificar depósitos.
-- Usuários normais (anon, authenticated) não devem poder alterar ou deletar depósitos.

-- Habilitar Row Level Security (idempotente)
ALTER TABLE IF EXISTS public.deposits ENABLE ROW LEVEL SECURITY;

-- Remover policies de UPDATE/DELETE antigas para evitar conflitos.
DROP POLICY IF EXISTS "Allow update deposits" ON public.deposits;
DROP POLICY IF EXISTS "Allow delete deposits" ON public.deposits;
DROP POLICY IF EXISTS "public_deposits_update" ON public.deposits;
DROP POLICY IF EXISTS "public_deposits_delete" ON public.deposits;
DROP POLICY IF EXISTS "Admins or service role can update deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins or service role can delete deposits" ON public.deposits;

-- Observações e segurança:
-- 1. A segurança de Nível de Linha (RLS) no Supabase é restritiva por padrão.
--    Se RLS está ATIVADO e não existe nenhuma política PERMISSIVA para uma ação (SELECT, INSERT, UPDATE, DELETE),
--    essa ação é NEGADA para todos, exceto para a 'service_role_key'.
--
-- 2. Ao não criar nenhuma política para UPDATE ou DELETE, estamos efetivamente
--    bloqueando essas operações para qualquer usuário que não esteja usando a
--    'service_role_key'. Isso é exatamente o que queremos.
--
-- 3. A função de webhook 'mercado-pago-webhook' usa a 'service_role_key',
--    então ela terá permissão para atualizar os depósitos.
--
-- 4. É importante garantir que exista uma política para INSERT e SELECT, se os usuários
--    precisarem criar ou ver seus próprios depósitos.

-- FIM
