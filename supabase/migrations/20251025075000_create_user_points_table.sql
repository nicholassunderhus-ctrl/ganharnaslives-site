-- Migration to create the user_points table

-- Cria a tabela user_points, se ela ainda não existir
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_earn_timestamp TIMESTAMP WITH TIME ZONE DEFAULT (now() - interval '2 minutes')
);

-- Função para criar a entrada de pontos para um novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_points (user_id, points, total_earned)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING; -- Adicionado para evitar erros se o registro já existir
  RETURN NEW;
END;
$$;

-- Função para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to automatically update updated_at on row modification
DROP TRIGGER IF EXISTS set_user_points_timestamp ON public.user_points;
CREATE TRIGGER set_user_points_timestamp
BEFORE UPDATE ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE IF EXISTS public.user_points ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own points
DROP POLICY IF EXISTS "Users can view their own points" ON public.user_points;
CREATE POLICY "Users can view their own points"
ON public.user_points FOR SELECT
USING (auth.uid() = user_id);

-- Trigger para criar a entrada de pontos quando um novo usuário se cadastra
DROP TRIGGER IF EXISTS on_auth_user_created_points ON auth.users;
CREATE TRIGGER on_auth_user_created_points
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_points();
