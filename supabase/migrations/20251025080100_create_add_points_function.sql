CREATE OR REPLACE FUNCTION add_points(user_id_input UUID, points_to_add INT)
RETURNS VOID AS $$
DECLARE
  current_points INT;
  current_total_earned INT;
BEGIN
  -- Tenta obter os pontos atuais e o total ganho do usuário
  SELECT points, total_earned
  INTO current_points, current_total_earned
  FROM public.user_points
  WHERE user_id = user_id_input;

  -- Se o usuário não tiver uma entrada na tabela, cria uma
  IF NOT FOUND THEN
    INSERT INTO public.user_points (user_id, points, total_earned)
    VALUES (user_id_input, points_to_add, points_to_add);
  ELSE
    -- Se o usuário já tiver uma entrada, atualiza os pontos
    UPDATE public.user_points
    SET
      points = current_points + points_to_add,
      total_earned = current_total_earned + points_to_add
    WHERE user_id = user_id_input;
  END IF;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;
