import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface EarnPointsPayload {
  streamId: string;
}

// A função principal que será executada quando a Edge Function for chamada
serve(async (req) => {
  // Trata a requisição pre-flight do CORS, necessária para o navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Valida se a requisição veio de um usuário autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Usuário não autenticado.');
    }
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Token de usuário inválido.');
    }

    // 2. Extrai o ID da stream do corpo da requisição
    const { streamId }: EarnPointsPayload = await req.json();
    if (!streamId) {
      throw new Error('O ID da stream (streamId) é obrigatório.');
    }

    // 3. Cria um cliente Supabase com permissões de administrador para operações seguras
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Busca os dados da stream para obter o `points_per_minute` e o status
    const { data: stream, error: streamError } = await supabaseAdmin
      .from('streams')
      .select('points_per_minute, status')
      .eq('id', streamId)
      .single();

    if (streamError || !stream) {
      throw new Error('Stream não encontrada ou erro ao buscar dados.');
    }
    // Garante que o usuário não ganhe pontos por uma live que já acabou
    if (stream.status !== 'live') {
      return new Response(JSON.stringify({ error: 'Esta live não está mais ativa.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pointsToAdd = stream.points_per_minute;

    // 5. Tenta adicionar os pontos usando a nova função RPC `try_add_points`
    const { data: wasSuccessful, error: rpcError } = await supabaseAdmin.rpc('try_add_points', {
      user_id_input: user.id,
      points_to_add: pointsToAdd,
    });

    if (rpcError) {
      throw new Error(`Erro ao creditar pontos: ${rpcError.message}`);
    }

    // Se a função retornou 'false', significa que o tempo de espera não foi atingido.
    if (!wasSuccessful) {
      throw new Error('Aguarde um minuto para ganhar pontos novamente.');
    }

    // 6. Retorna uma resposta de sucesso para o frontend
    return new Response(JSON.stringify({
      success: true,
      pointsEarned: pointsToAdd,
      message: `${pointsToAdd} pontos ganhos com sucesso!`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na função earn-points:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
