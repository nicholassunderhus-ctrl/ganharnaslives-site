-- Função para finalizar streams que expiraram.
CREATE OR REPLACE FUNCTION public.finish_expired_streams()
RETURNS void AS $$
BEGIN
  UPDATE public.streams
  SET status = 'finished'
  WHERE 
    status = 'live' 
    AND created_at <= NOW() - (duration_minutes * INTERVAL '1 minute');
END;
$$ LANGUAGE plpgsql;