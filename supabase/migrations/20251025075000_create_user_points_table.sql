-- Primeiro, criamos a tabela
CREATE TABLE IF NOT EXISTS public.user_points (
    user_id uuid NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_points_pkey PRIMARY KEY (user_id),
    CONSTRAINT user_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Em seguida, habilitamos o realtime para ela
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_points;
