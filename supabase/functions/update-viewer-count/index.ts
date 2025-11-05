import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ViewerCountPayload {
  streamId: string;
  action: 'join' | 'leave';
}

serve(async (req) => {
  // Lida com a requisição pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Valida se a requisição veio de um usuário autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Usuário não autenticado.');
    }

    // Adicionado: Validação real do token do usuário
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Token de usuário inválido ou expirado.');
    }

    // Extrai os dados do corpo da requisição
    const { streamId, action }: ViewerCountPayload = await req.json();
    if (!streamId || !action) {
      throw new Error('streamId e action são obrigatórios.');
    }
    if (action !== 'join' && action !== 'leave') {
      throw new Error('A ação deve ser "join" ou "leave".');
    }

    // Cria um cliente Supabase com permissões de administrador para modificar o banco
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Define o valor a ser incrementado (positivo para 'join', negativo para 'leave')
    const incrementValue = action === 'join' ? 1 : -1;

    // Busca o valor atual para garantir que não fique negativo
    const { data: streamData, error: fetchError } = await supabaseAdmin
      .from('streams')
      .select('current_viewers')
      .eq('id', streamId)
      .single();

    if (fetchError) throw new Error(`Stream não encontrada: ${fetchError.message}`);

    // Evita que a contagem fique negativa se um 'leave' for chamado com 0 viewers
    if (action === 'leave' && streamData.current_viewers <= 0) {
      return new Response(JSON.stringify({ success: true, message: 'Contagem já é zero.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CORREÇÃO: Usa a função RPC 'update_stream_viewers' para uma atualização atômica e segura
    const { error: updateError } = await supabaseAdmin.rpc('update_stream_viewers', {
      stream_id_input: streamId,
      increment_value: incrementValue
    });

    if (updateError) {
      throw new Error(`Erro ao atualizar a contagem de espectadores: ${updateError.message}`);
    }

    // Retorna uma resposta de sucesso
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na função update-viewer-count:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
