-- Adicionar coluna is_admin na tabela auth.users
ALTER TABLE auth.users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Criar política que permite apenas admins acessarem a rota /admin
CREATE POLICY "Apenas admins podem modificar current_viewers"
ON public.streams
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id AND is_admin = true
  )
);