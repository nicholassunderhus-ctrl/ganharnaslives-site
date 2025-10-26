-- Adicionar campo current_viewers à tabela streams
ALTER TABLE public.streams
ADD COLUMN current_viewers INTEGER NOT NULL DEFAULT 0;

-- Criar função para atualizar current_viewers quando um usuário começa a assistir
CREATE OR REPLACE FUNCTION public.handle_stream_viewer_join()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementar current_viewers apenas se não exceder max_viewers
  IF (SELECT current_viewers FROM public.streams WHERE id = NEW.stream_id) < 
     (SELECT max_viewers FROM public.streams WHERE id = NEW.stream_id) THEN
    UPDATE public.streams 
    SET current_viewers = current_viewers + 1
    WHERE id = NEW.stream_id;
  ELSE
    RETURN NULL; -- Não permitir mais viewers se a live estiver cheia
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para atualizar current_viewers quando um usuário para de assistir
CREATE OR REPLACE FUNCTION public.handle_stream_viewer_leave()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.streams 
  SET current_viewers = GREATEST(current_viewers - 1, 0)
  WHERE id = OLD.stream_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;