-- Função para verificar se o usuário logado é um administrador.
-- Ela lê o campo 'is_admin' dos metadados do usuário no JWT.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- O operador '->>' extrai o valor como texto.
  -- A conversão para jsonb é para segurança e eficiência.
  -- coalesce garante que se o campo não existir, o resultado será 'false'.
  SELECT coalesce(
    (auth.jwt()->>'raw_user_meta_data')::jsonb->>'is_admin',
    'false'
  )::boolean;
$$;
