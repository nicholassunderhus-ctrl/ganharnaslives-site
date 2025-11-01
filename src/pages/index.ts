import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Função 'update-expired-streams' inicializada.");

serve(async (req) => {
  // Esta função é projetada para ser acionada por um Cron Job, não por requisições HTTP diretas.
  // No entanto, adicionamos uma verificação de segurança para garantir que ela não seja executada indevidamente.
  const authHeader = req.headers.get("Authorization")!;
  if (authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response("Não autorizado", { status: 401 });
  }

  try {
    // Cria um cliente Supabase com permissões de administrador para modificar a tabela.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Busca todas as streams que ainda estão com status 'live'.
    const { data: liveStreams, error: fetchError } = await supabaseAdmin
      .from("streams")
      .select("id, created_at, duration_minutes")
      .eq("status", "live");

    if (fetchError) throw fetchError;

    const now = new Date();
    const expiredStreamIds: string[] = [];

    for (const stream of liveStreams) {
      const createdAt = new Date(stream.created_at);
      const expirationTime = new Date(createdAt.getTime() + stream.duration_minutes * 60000);

      // Se o tempo de expiração já passou, adiciona o ID à lista de lives a serem encerradas.
      if (now > expirationTime) {
        expiredStreamIds.push(stream.id);
      }
    }

    if (expiredStreamIds.length > 0) {
      // Atualiza o status de todas as lives expiradas para 'finished' de uma só vez.
      await supabaseAdmin
        .from("streams")
        .update({ status: "finished" })
        .in("id", expiredStreamIds);
      
      console.log(`${expiredStreamIds.length} live(s) expirada(s) foram encerradas.`);
    }

    return new Response(JSON.stringify({ success: true, closed_streams: expiredStreamIds.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro ao encerrar lives expiradas:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});