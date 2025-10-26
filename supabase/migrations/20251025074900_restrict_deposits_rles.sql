-- Migration: 20251025074900_restrict_deposits_rles.sql
-- Objetivo: adicionar políticas RESTRITIVAS que negam UPDATE e DELETE na tabela public.deposits
-- para usuários regulares. Apenas administradores (is_admin = true) e o papel de serviço
-- do Supabase devem poder executar UPDATE e DELETE.

-- Habilitar Row Level Security (idempotente)
ALTER TABLE IF EXISTS public.deposits ENABLE ROW LEVEL SECURITY;

-- Remover policies permissivas existentes (se houver)
DROP POLICY IF EXISTS "Allow update deposits" ON public.deposits;
DROP POLICY IF EXISTS "Allow delete deposits" ON public.deposits;
DROP POLICY IF EXISTS "public_deposits_update" ON public.deposits;
DROP POLICY IF EXISTS "public_deposits_delete" ON public.deposits;

-- Política: permitir UPDATE apenas para administradores (is_admin = true)
-- e para o role service (caso o backend utilize a service_role JWT).
-- NOTE: auth.role() é suportado para verificar roles do JWT no Supabase.
CREATE POLICY "Admins or service role can update deposits"
ON public.deposits
FOR UPDATE
USING (
  (
    -- Usuários admin (flag is_admin na tabela auth.users)
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id AND is_admin = true
    )
  )
  OR auth.role() = 'service_role'
);

-- Política: permitir DELETE apenas para administradores e service_role
CREATE POLICY "Admins or service role can delete deposits"
ON public.deposits
FOR DELETE
USING (
  (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id AND is_admin = true
    )
  )
  OR auth.role() = 'service_role'
);

-- Observações e segurança:
-- 1) Se não existir nenhuma outra policy que permita UPDATE/DELETE para outros
--    usuários, estas policies tornam o comportamento restritivo por design —
--    usuários regulares não poderão atualizar nem deletar registros em
--    public.deposits.
-- 2) Incluí também a checagem por auth.role() = 'service_role' para permitir que
--    chamadas autenticadas com a service role (usadas pelo backend/cron jobs)
--    continuem a funcionar. Se você não utiliza a service_role JWT para alterações,
--    pode remover essa verificação.
-- 3) Após aplicar a migration, teste com um usuário normal e com um admin para
--    validar o comportamento.

-- FIM
